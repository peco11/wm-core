import {createSelector} from '@ngrx/store';
import {WmFeature} from '@wm-types/feature';
import {Point} from 'geojson';
import {ugcOpened} from '../user-activity/user-activity.selector';
import {
  countEcAll,
  countEcPois,
  countEcTracks,
  currentEcPoi,
  currentEcRelatedPoi,
  currentEcTrack,
  ec,
  ecPois,
  ecTracks,
} from './ec/ec.selector';
import {
  countUgcAll,
  countUgcPois,
  countUgcTracks,
  currentUgcPoi,
  currentUgcTrack,
  ugcPoiFeatures,
  ugcTracks,
} from './ugc/ugc.selector';

export const countAll = createSelector(countEcAll, countUgcAll, ugcOpened, (ec, ugc, ugcOpened) =>
  ugcOpened ? ugc : ec,
);
export const countPois = createSelector(
  countEcPois,
  countUgcPois,
  ugcOpened,
  (ec, ugc, ugcOpened) => (ugcOpened ? ugc : ec),
);
export const countTracks = createSelector(
  countEcTracks,
  countUgcTracks,
  ugcOpened,
  (ec, ugc, ugcOpened) => (ugcOpened ? ugc : ec),
);

export const tracks = createSelector(ecTracks, ugcTracks, ugcOpened, (ec, ugc, ugcOpened) =>
  ugcOpened ? ugc : ec,
);
export const pois = createSelector(ecPois, ugcPoiFeatures, ugcOpened, (ec, ugc, ugcOpened) => {
  return (ugcOpened ? ugc : ec) as WmFeature<Point>[];
});

export const track = createSelector(
  currentEcTrack,
  currentUgcTrack,
  ugcOpened,
  (ec, ugc, ugcOpened) => {
    return ugcOpened ? ugc : ec;
  },
);
export const poi = createSelector(
  currentEcPoi,
  currentEcRelatedPoi,
  currentUgcPoi,
  ugcOpened,
  (ecPoi, ecRelatedPoi, ugcPoi, ugcOpened) => {
    let poi = ecPoi ?? ecRelatedPoi;
    return ugcOpened ? ugcPoi : poi;
  },
);
