import {
  applyWhere,
  goToHome,
  inputTyped,
  setLayer,
  toggleTrackFilter,
  toggleTrackFilterByIdentifier,
  updateTrackFilter,
} from './user-activity.action';
import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {Store} from '@ngrx/store';
import {ecTracksSuccess, ecTracksFailure, ecTracks} from '@wm-core/store/features/ec/ec.actions';
import {
  closeUgc,
  removeTrackFilters,
  resetTrackFilters,
  setLoading,
} from '@wm-core/store/user-activity/user-activity.action';
import {
  ecLayer,
  filterTracks,
  inputTyped as inputTypedSelector,
} from '@wm-core/store/user-activity/user-activity.selector';
import {debounceTime, map, mergeMap, switchMap, tap, withLatestFrom} from 'rxjs/operators';
import {combineLatest, of} from 'rxjs';
import {ActivatedRoute, Router} from '@angular/router';
import {Filter} from '@wm-core/types/config';

@Injectable()
export class UserActivityEffects {
  goToHome$ = createEffect(() =>
    this._actions$.pipe(
      ofType(goToHome),
      mergeMap(() => of(inputTyped({inputTyped: ''}), setLayer(null), resetTrackFilters())),
      tap(() =>
        this._router.navigate([], {
          relativeTo: this._route,
          queryParams: {layer: null, filter: null},
          queryParamsHandling: 'merge',
        }),
      ),
    ),
  );
  removeTrackFilters$ = createEffect(() =>
    this._actions$.pipe(
      ofType(removeTrackFilters),
      map(() => ecTracks({})),
    ),
  );
  setLoadingStart$ = createEffect(() =>
    this._actions$.pipe(
      ofType(resetTrackFilters, setLayer, toggleTrackFilter, updateTrackFilter, applyWhere),
      map(() => setLoading({loading: true})),
    ),
  );
  setLoadingStopFail$ = createEffect(() =>
    this._actions$.pipe(
      ofType(ecTracksFailure),
      map(() => setLoading({loading: false})),
    ),
  );
  setLoadingStopSuccess$ = createEffect(() =>
    this._actions$.pipe(
      ofType(ecTracksSuccess),
      map(() => setLoading({loading: false})),
    ),
  );
  toggleTrackFilterByIdentifier$ = createEffect(() =>
    this._actions$.pipe(
      ofType(toggleTrackFilterByIdentifier),
      withLatestFrom(this._store),
      //@ts-ignore
      switchMap(([action, state]) => {
        let filters: Filter[] = [];
        try {
          filters = state['conf']['MAP'].filters[action.taxonomy].options;
        } catch (_) {}
        let filter = filters.filter(f => f.identifier === action.identifier);
        if (filter.length > 0) {
          return of({
            type: '[ec] toggle track filter',
            filter: {...filter[0], taxonomy: action.taxonomy},
          });
        }
      }),
    ),
  );
  triggerQueryOnInput$ = createEffect(() =>
    combineLatest([
      this._store.select(inputTypedSelector),
      this._store.select(filterTracks),
      this._store.select(ecLayer),
    ]).pipe(
      debounceTime(300),
      map(([inputTyped, filterTracks, layer]) => ({
        inputTyped: inputTyped?.trim(),
        filterTracks,
        layer,
      })),
      switchMap(({inputTyped, filterTracks, layer}) => {
        let query = {init: false};
        if (inputTyped != null && inputTyped !== '') {
          query = {...query, ...{inputTyped}};
        }
        if (filterTracks != null && filterTracks.length > 0) {
          query = {...query, ...{filterTracks}};
        }
        query = {...query, ...{layer}};
        return [ecTracks(query), closeUgc()];
      }),
    ),
  );

  constructor(
    private _actions$: Actions,
    private _store: Store,
    private _router: Router,
    private _route: ActivatedRoute,
  ) {}
}