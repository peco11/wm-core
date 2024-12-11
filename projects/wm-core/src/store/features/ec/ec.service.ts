import {HttpClient} from '@angular/common/http';

/* eslint-disable quote-props */
import {Inject, Injectable} from '@angular/core';
import {FeatureCollection, LineString} from 'geojson';
import {from, Observable, of} from 'rxjs';
// @ts-ignore
import {catchError, switchMap, tap} from 'rxjs/operators';
import {IRESPONSE} from '@wm-core/types/elastic';
import {WmLoadingService} from '../../../services/loading.service';
import {Filter, SliderFilter} from '../../../types/config';
import {EnvironmentConfig, ENVIRONMENT_CONFIG} from '../../conf/conf.token';
import {synchronizedApi} from '@wm-core/utils/localForage';
import {WmFeature} from '@wm-types/feature';
@Injectable({
  providedIn: 'root',
})
export class EcService {
  private _elasticApi: string = this.environment.elasticApi;
  private _geohubAppId: number = this.environment.geohubId;
  private _queryDic: {[query: string]: any} = {};
  private _shard = 'geohub_app';

  private get _baseUrl(): string {
    return this._geohubAppId
      ? `${this._elasticApi}/?app=${this._shard}_${this._geohubAppId}`
      : this._elasticApi;
  }

  /**
   * Creates an instance of ElasticService.
   * @param {HttpClient} _http
   * @memberof ElasticService
   */
  constructor(
    @Inject(ENVIRONMENT_CONFIG) public environment: EnvironmentConfig,
    private _http: HttpClient,
    private _loadingSvc: WmLoadingService,
  ) {
    this._elasticApi = this.environment.elasticApi;
    const hostname: string = window.location.hostname;
    if (hostname.indexOf('localhost') < 0) {
      const matchedHost = Object.keys(hostToGeohubAppId).find(host => hostname.includes(host));

      if (matchedHost) {
        this._geohubAppId = hostToGeohubAppId[matchedHost];
      } else {
        const newGeohubId = parseInt(hostname.split('.')[0], 10);
        if (!Number.isNaN(newGeohubId)) {
          this._geohubAppId = newGeohubId;
        }
      }
    }
  }

  public getEcTrack(id: string | number): Observable<WmFeature<LineString>> {
    if (id == null) return of(null);
    if (+id > -1) {
      const url = `${this.environment.awsApi}/tracks/${id}.json`;
      return this._http.get<WmFeature<LineString>>(url);
    }
  }

  public getPois(): Observable<FeatureCollection> {
    const poisUrl = `${this.environment.awsApi}/pois/${this._geohubAppId}.geojson`;

    return new Observable<FeatureCollection>(observer => {
      synchronizedApi.getItem(poisUrl).then((cachedData: string | null) => {
        let parsedData: FeatureCollection | null = null;

        // Verifica se i dati in cache sono validi
        if (cachedData) {
          try {
            parsedData = JSON.parse(cachedData) as FeatureCollection;

            // Controlla se i dati hanno una struttura valida
            if (!parsedData || !parsedData.features) {
              console.warn('Invalid cache format. Ignoring cached data.');
              parsedData = null;
            }
          } catch (e) {
            console.warn('Error parsing cached data. Ignoring cached data.', e);
            parsedData = null;
          }
        }

        // Se i dati in cache sono validi, confrontali con quelli scaricati
        this._http.get<FeatureCollection>(poisUrl).subscribe(
          pois => {
            if (!cachedData || cachedData !== JSON.stringify(pois)) {
              synchronizedApi.setItem(poisUrl, JSON.stringify(pois)); // Aggiorna la cache
              observer.next(pois); // Emissione dati aggiornati
            } else {
              console.log('pois Cache is up-to-date. No changes detected.');
            }
            observer.complete();
          },
          error => {
            if (!parsedData) {
              observer.error(error); // Emissione errore se non c'è cache
            } else {
              observer.complete(); // Completa comunque se c'è cache
            }
          },
        );
      });
    });
  }

  /**
   * @description
   * This function is called getQuery and takes two optional parameters,
   * inputTyped and layer. It returns an Observable of type IELASTIC.
   * It builds a query string using the baseUrl and the two optional parameters
   * if they are provided. It then makes a GET request to the built query string and returns
   * the result as an Observable of type IELASTIC.
   *
   * @param {string} [inputTyped]
   * @param {number} [layer]
   * @returns {*}  {Observable<IELASTIC>}
   * @memberof ElasticService
   */
  async getQuery(options: {
    inputTyped?: string;
    layer?: any;
    filterTracks?: Filter[];
  }): Promise<IRESPONSE> {
    let query = this._baseUrl;

    if (options.inputTyped) {
      query += `&query=${options.inputTyped.replace(/ /g, '%20')}`;
    }

    if (options.layer && options.layer.id != null) {
      query += `&layer=${options.layer.id}`;
    }

    if (options.filterTracks != null && options.filterTracks.length > 0) {
      const paramString = options.filterTracks.map(filterTrack => {
        if (filterTrack.type === 'slider') {
          const sliderFilter = filterTrack as unknown as SliderFilter;
          return JSON.stringify({
            identifier: sliderFilter.identifier,
            min: sliderFilter.lower,
            max: sliderFilter.upper,
          });
        } else {
          return JSON.stringify({
            identifier: filterTrack.identifier,
            taxonomy: filterTrack.taxonomy,
          });
        }
      });

      query += `&filters=[${paramString.toString()}]`;
    }
    if (this._queryDic[query] == null) {
      const value = await this._http.request('get', query).toPromise();
      this._queryDic[query] = value;
    }
    return this._queryDic[query];
  }
}

export const hostToGeohubAppId: {[key: string]: number} = {
  'sentieri.caiparma.it': 33,
  'motomappa.motoabbigliamento.it': 53,
  'maps.parcoforestecasentinesi.it': 49,
  'maps.parcopan.org': 63,
  'maps.acquasorgente.cai.it': 58,
  'maps.caipontedera.it': 59,
  'maps.parcapuane.it': 62,
  'fiemaps.it': 29,
  'fiemaps.eu': 29,
};