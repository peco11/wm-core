import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {from, of} from 'rxjs';
import {catchError, map, switchMap, withLatestFrom} from 'rxjs/operators';
import {
  addActivities,
  inputTyped,
  loadPois,
  loadPoisFail,
  loadPoisSuccess,
  query,
  queryApiFail,
  queryApiSuccess,
  removeActivities,
  setLayer,
} from './api.actions';
import {ApiService} from './api.service';
import {ApiRootState} from './api.reducer';
import {Store} from '@ngrx/store';
import {SearchResponse} from 'elasticsearch';
import {apiTrackFilterIdentifier} from './api.selector';

@Injectable({
  providedIn: 'root',
})
export class ApiEffects {
  addActivitiesApi$ = createEffect(() =>
    this._store.select(apiTrackFilterIdentifier).pipe(
      withLatestFrom(this._store),
      switchMap(([trackFilterIdentifier, state]) => {
        const api = state['query'];
        return of({
          type: '[api] Query',
          ...{activities: trackFilterIdentifier},
          ...{layer: api.layer},
          ...{inputTyped: api.inputTyped},
        });
      }),
    ),
  );
  inputTypedApi$ = createEffect(() =>
    this._actions$.pipe(
      ofType(inputTyped),
      switchMap(_ => {
        return of({
          type: '[api] Query',
        });
      }),
    ),
  );
  loadPois$ = createEffect(() =>
    this._actions$.pipe(
      ofType(loadPois),
      switchMap(() =>
        this._apiSVC.getPois().pipe(
          map(featureCollection => loadPoisSuccess({featureCollection})),
          catchError(() => of(loadPoisFail())),
        ),
      ),
    ),
  );
  queryApi$ = createEffect(() =>
    this._actions$.pipe(
      ofType(query),
      withLatestFrom(this._store),
      switchMap(([action, state]) => {
        const api = state['query'];
        if (api.activities.length === 0 && api.layer == null && api.inputTyped == null) {
          return of(queryApiFail());
        }
        const newAction = {
          ...action,
          ...{activities: api.activities},
          ...{layer: api.layer},
          ...{inputTyped: api.inputTyped},
        };
        return from(this._apiSVC.getQuery(newAction)).pipe(
          map((search: SearchResponse<any>) => queryApiSuccess({search})),
          catchError(e => of(queryApiFail())),
        );
      }),
    ),
  );
  removeActivitiesApi$ = createEffect(() =>
    this._actions$.pipe(
      ofType(removeActivities),
      switchMap(_ => {
        return of({
          type: '[api] Query',
        });
      }),
    ),
  );
  setLayerApi$ = createEffect(() =>
    this._actions$.pipe(
      ofType(setLayer),
      switchMap(_ => {
        return of({
          type: '[api] Query',
        });
      }),
    ),
  );

  constructor(
    private _apiSVC: ApiService,
    private _actions$: Actions,
    private _store: Store<ApiRootState>,
  ) {}
}