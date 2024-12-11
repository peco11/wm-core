import {LineString, Point} from 'geojson';
import {createReducer, on} from '@ngrx/store';
import {
  syncUgc,
  syncUgcFailure,
  syncUgcTracks,
  syncUgcPois,
  updateUgcTracks,
  updateUgcPois,
  loadCurrentUgcTrackSuccess,
  loadCurrentUgcTrackFailure,
} from '@wm-core/store/features/ugc/ugc.actions';
import {WmFeature} from '@wm-types/feature';
import {IHIT} from '@wm-core/types/elastic';
export const searchKey = 'search';
export interface UgcState {
  syncing: boolean;
  syncable: boolean;
  ugcPoiFeatures?: WmFeature<Point>[];
  ugcTrackFeatures?: WmFeature<LineString>[];
  ugcTracks: IHIT[];
  ugcPois: IHIT[];
  currentUgcTrack?: WmFeature<LineString>;
}
export interface ApiRootState {
  [searchKey]: UgcState;
}

const initialState: UgcState = {
  ugcPoiFeatures: [],
  ugcTrackFeatures: [],
  syncing: false,
  syncable: false,
  ugcTracks: [],
  ugcPois: [],
};

export const UgcReducer = createReducer(
  initialState,
  on(syncUgc, syncUgcTracks, syncUgcPois, state => ({
    ...state,
    syncing: true,
  })),
  on(updateUgcTracks, (state, {ugcTrackFeatures}) => {
    const ugcTracks = wmFeatureToHits(ugcTrackFeatures);
    return {
      ...state,
      ugcTrackFeatures,
      ugcTracks,
    };
  }),
  on(updateUgcPois, (state, {ugcPoiFeatures}) => {
    const ugcPois = wmFeatureToHits(ugcPoiFeatures);
    return {
      ...state,
      ugcPoiFeatures,
      ugcPois,
    };
  }),
  on(syncUgcFailure, (state, {responseType, error}) => ({
    ...state,
    syncing: false,
  })),
  on(loadCurrentUgcTrackSuccess, (state, {ugcTrack}) => ({
    ...state,
    currentUgcTrack: ugcTrack,
  })),
  on(loadCurrentUgcTrackFailure, (state, {error}) => ({
    ...state,
    error,
  })),
);
export function wmFeatureToHits(features: WmFeature<LineString | Point>[]): IHIT[] {
  const hits: IHIT[] = [];

  features.forEach(feature => {
    const activity = feature.properties?.form?.activity;
    const hit: IHIT = {
      id: `${feature.properties.id ?? feature.properties.uuid}`,
      taxonomyActivities: activity ? [activity] : [],
      taxonomyWheres: [],
      cai_scale: '',
      distance: '',
      feature_image: null,
      layers: [],
      name: feature.properties.name,
      properties: feature.properties,
      ref: '',
    };

    hits.push(hit);
  });

  return hits;
}