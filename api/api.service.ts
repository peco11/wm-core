import {HttpClient} from '@angular/common/http';

/* eslint-disable quote-props */
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {environment} from 'src/environments/environment';
// const baseUrl = 'https://elastic-passtrough.herokuapp.com/search';
const baseUrl = 'https://elastic-json.webmapp.it/search';
@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private _geohubAppId: number = environment.geohubId;

  /**
   * Creates an instance of ElasticService.
   * @param {HttpClient} _http
   * @memberof ElasticService
   */
  constructor(private _http: HttpClient) {
    const hostname: string = window.location.hostname;
    if (hostname.indexOf('localhost') < 0) {
      const newGeohubId = parseInt(hostname.split('.')[0], environment.geohubId);
      if (!Number.isNaN(newGeohubId)) {
        this._geohubAppId = newGeohubId;
      }
    }
    if (hostname.indexOf('mobile') > 0) {
      const newGeohubId = parseInt(hostname.split('.')[0]);
      if (!Number.isNaN(newGeohubId)) {
        this._geohubAppId = newGeohubId;
      }
    }
  }

  private get _baseUrl(): string {
    return this._geohubAppId ? `${baseUrl}/?id=${this._geohubAppId}` : baseUrl;
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
  getQuery(inputTyped?: string, layer?: number): Observable<IELASTIC> {
    let query = this._baseUrl;

    if (inputTyped) {
      query += `&query=${inputTyped}`;
    }

    if (layer) {
      query += `&layer=${layer}`;
    }

    return this._http.request('get', query);
  }
}
