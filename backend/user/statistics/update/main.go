package main

import (
	"context"
	"time"

	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
)

type Event events.CloudWatchEvent

const funcName = "user-statistics-update-handler"

var repository = database.DynamoDB

var monthAgo = time.Now().Add(database.ONE_MONTH_AGO).Format(time.RFC3339)

func updateStats(stats *database.UserStatistics, user *database.User, requirements []*database.Requirement) {
	if !user.DojoCohort.IsValid() || user.RatingSystem == "" {
		return
	}

	isActive := user.UpdatedAt >= monthAgo
	ratingChange := user.GetRatingChange()
	score := user.CalculateScore(requirements)

	var minutes int
	for _, progress := range user.Progress {
		m, _ := progress.MinutesSpent[user.DojoCohort]
		minutes += m
	}

	cohortStats := stats.Cohorts[user.DojoCohort]
	if isActive {
		cohortStats.ActiveParticipants += 1
		cohortStats.ActiveDojoScores += score
		cohortStats.ActiveRatingChanges += ratingChange
		cohortStats.ActiveRatingSystems[user.RatingSystem] += 1
		cohortStats.ActiveMinutesSpent += minutes
		if minutes > 0 {
			cohortStats.ActiveRatingChangePerHour += 60 * (float32(ratingChange) / float32(minutes))
		}
	} else {
		cohortStats.InactiveParticipants += 1
		cohortStats.InactiveDojoScores += score
		cohortStats.InactiveRatingChanges += ratingChange
		cohortStats.InactiveRatingSystems[user.RatingSystem] += 1
		cohortStats.InactiveMinutesSpent += minutes
		if minutes > 0 {
			cohortStats.InactiveRatingChangePerHour += 60 * (float32(ratingChange) / float32(minutes))
		}
	}
}

func Handler(ctx context.Context, event Event) (Event, error) {
	log.Debugf("Event: %#v", event)
	log.SetRequestId(event.ID)

	log.Debug("Fetching requirements")
	var requirements []*database.Requirement
	var rs []*database.Requirement
	var startKey string
	var err error
	for ok := true; ok; ok = startKey != "" {
		rs, startKey, err = repository.ScanRequirements("", startKey)
		if err != nil {
			log.Errorf("Failed to scan requirements: %v", err)
			return event, err
		}
		requirements = append(requirements, rs...)
	}
	log.Debugf("Got %d requirements", len(requirements))

	stats := database.NewUserStatistics()
	for _, cohort := range database.Cohorts {
		log.Debugf("Processing cohort %s", cohort)

		var users []*database.User
		startKey = ""
		for ok := true; ok; ok = startKey != "" {
			users, startKey, err = repository.ListUserRatings(cohort, startKey)
			if err != nil {
				log.Errorf("Failed to scan users: %v", err)
				return event, err
			}

			log.Infof("Processing %d users", len(users))
			for _, u := range users {
				updateStats(stats, u, requirements)
			}
		}
	}

	if err := repository.SetUserStatistics(stats); err != nil {
		log.Error(err)
		return event, err
	}

	return event, nil
}

func main() {
	lambda.Start(Handler)
}