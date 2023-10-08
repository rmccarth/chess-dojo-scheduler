package main

import (
	"context"
	"fmt"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

var repository = database.DynamoDB

func main() {
	lambda.Start(handler)
}

func handler(ctx context.Context, event events.DynamoDBEvent) (events.DynamoDBEventResponse, error) {
	log.Debugf("Event: %#v", event)

	failures := make([]events.DynamoDBBatchItemFailure, 0, len(event.Records))

	for _, record := range event.Records {
		if record.EventName != "INSERT" {
			continue
		}

		log.Debugf("Record: %#v", record)
		submitted, err := processRecord(record)
		if err != nil {
			log.Errorf("Failed with %d submitted: %v", submitted, err)
			failures = append(failures, events.DynamoDBBatchItemFailure{
				ItemIdentifier: record.Change.SequenceNumber,
			})
		} else {
			log.Debugf("Submitted %d newsfeed entries", submitted)
		}
	}

	return events.DynamoDBEventResponse{
		BatchItemFailures: failures,
	}, nil
}

func processRecord(record events.DynamoDBEventRecord) (int, error) {
	poster := record.Change.Keys["owner"].String()
	id := record.Change.Keys["id"].String()
	createdAt := time.Now().Format(time.RFC3339)
	sortKey := fmt.Sprintf("%s_%s", createdAt, id)
	cohort := record.Change.NewImage["cohort"].String()

	entries := make([]database.NewsfeedEntry, 0, 25)

	var followers []database.FollowerEntry
	var startKey string
	var err error
	var attempted int
	var success int

	for ok := true; ok; ok = startKey != "" {
		followers, startKey, err = repository.ListFollowers(poster, startKey)
		if err != nil {
			return success, err
		}
		attempted += len(followers)

		var submitted int
		for _, f := range followers {
			entries = append(entries, database.NewsfeedEntry{
				NewsfeedId: f.Follower,
				SortKey:    sortKey,
				CreatedAt:  createdAt,
				Poster:     poster,
				TimelineId: id,
			})
			entries, submitted, err = submitIfNecessary(entries)
			success += submitted
			if err != nil {
				return success, err
			}
		}
	}

	entries = append(entries, database.NewsfeedEntry{
		NewsfeedId: cohort,
		SortKey:    sortKey,
		CreatedAt:  createdAt,
		Poster:     poster,
		TimelineId: id,
	})
	submitted, err := repository.PutNewsfeedEntries(entries)
	success += submitted
	if err != nil {
		return success, err
	}

	if success < attempted {
		return success, fmt.Errorf("Success (%d) < Attempted (%d) for Record: %#v", success, attempted, record)
	}
	return success, nil
}

func submitIfNecessary(entries []database.NewsfeedEntry) ([]database.NewsfeedEntry, int, error) {
	var submitted int
	var err error
	if len(entries) == 25 {
		submitted, err = repository.PutNewsfeedEntries(entries)
		entries = entries[:0]
	}
	return entries, submitted, err
}
