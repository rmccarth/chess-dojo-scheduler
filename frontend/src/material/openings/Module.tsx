import { OpeningModule, OpeningModuleType } from '../../database/opening';
import PgnViewerModule from './PgnViewerModule';
import SparringPositionsModule from './SparringPositionsModule';
import VideoModule from './VideoModule';

export interface ModuleProps {
    module: OpeningModule;
}

const Module: React.FC<ModuleProps> = ({ module }) => {
    switch (module.type) {
        case OpeningModuleType.Video:
            return <VideoModule module={module} />;
        case OpeningModuleType.PgnViewer:
            return <PgnViewerModule module={module} />;
        case OpeningModuleType.SparringPositions:
            return <SparringPositionsModule module={module} />;
        case OpeningModuleType.ModelGames:
            return null;
        case OpeningModuleType.Themes:
            return null;
        default:
            return null;
    }
};

export default Module;
