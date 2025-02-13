import {createReducer, on} from '@ngrx/store';
import { ICONF, ICONTROLS, ILAYER } from 'wm-core/types/config';
import {loadConfSuccess} from './conf.actions';
export const confFeatureKey = 'conf';
export interface IConfRootState {
  [confFeatureKey]: ICONF;
}

const initialConfState: ICONF = {
  APP: {
    name: 'Webmapp',
    geohubId: undefined,
  },
  WEBAPP: {
    draw_track_show: false,
    editing_inline_show: false,
    splash_screen_show: false,
  },
  OPTIONS: {
    baseUrl: '-',
    startUrl: '/main/map',
    privacyUrl: 'webmapp.it/privacy',
    passwordRecoveryUrl: '/wp-login.php?action=lostpassword',
    hideGlobalMap: false,
    addArrowsOverTracks: false,
    download_track_enable: true,
    print_track_enable: false,
    showTrackRefLabel: false,
    useCaiScaleStyle: false,
    forceDefaultFeatureColor: false,
    useFeatureClassicSelectionStyle: false,
    downloadRoutesInWebapp: false,
    showPoiListOffline: false,
    showHelp: false,
    hideDisclaimer: false,
    showDifficultyLegend: false,
    showEditLink: false,
    hideSearch: false,
    hideFilters: false,
    resetFiltersAtStartup: false,
    startFiltersDisabled: false,
    showMapViewfinder: false,
    highlightMapButton: false,
    hideNewsletterInSignup: false,
    forceWelcomePagePopup: false,
    skipRouteIndexDownload: false,
    downloadFullGemoetryRouteIndex: false,
    show_searchbar: true,
    enableTrackAdoption: false,
    highlightReadMoreButton: false,
    trackRefLabelZoom: 12,
    caiScaleStyleZoom: 12,
    poiSelectedRadius: 2.5,
    poiIconZoom: 15,
    poiIconRadius: 1.7,
    poiMaxRadius: 1.7,
    poiMinRadius: 0.2,
    poiMinZoom: 1,
    poiLabelMinZoom: 10,
    minDynamicOverlayLayersZoom: 12,
    clustering: {
      enable: false,
      radius: 70,
      highZoomRadius: 70,
    },
    showAppDownloadButtons: {
      track: false,
      poi: false,
      route: false,
      all: false,
    },
    showGpxDownload: false,
    showKmlDownload: false,
    showDurationForward: true,
    showDurationBackward: true,
    showDistance: true,
    showAscent: true,
    showDescent: true,
    showEleMax: true,
    showEleMin: true,
    showEleFrom: true,
    showEleTo: true,
    showGeojsonDownload: false,
    showShapefileDownload: false,
  },
  THEME: {
    primary: '#3880ff',
    secondary: '#0cd1e8',
    tertiary: '#ff0000',
    select: 'rgba(226, 249, 0, 0.6)',
    success: '#10dc60',
    warning: '#ffce00	',
    danger: '#f04141',
    dark: '#000000',
    medium: '#989aa2',
    light: '#ffffff',
    fontXxxlg: '28px',
    fontXxlg: '25px',
    fontXlg: '22px',
    fontLg: '20px',
    fontMd: '17px',
    fontSm: '14px',
    fontXsm: '12px',
    fontFamilyHeader: 'Roboto Slab',
    fontFamilyContent: 'Roboto',
    defaultFeatureColor: '#000000',
    theme: 'webmapp',
  },
};

export const confReducer = createReducer(
  initialConfState,
  on(loadConfSuccess, (state, {conf}) => {
    localStorage.setItem('appname', state.APP.name);
    let MAP = {...state.MAP, ...{...conf.MAP}};
    if (conf.APP.geohubId === 3) {
      let res = {};
      const mockedMapLayers = conf.MAP.layers.map((layer: ILAYER) => {
        const edgesObj = layer.edges ?? {};
        const edgesKeys = Object.keys(edgesObj);
        edgesKeys.forEach(edgeKey => {
          let edgeObj = edgesObj[edgeKey];
          const nextCrossroads = isCrossroads(edgesObj, +edgeKey, 'prev');
          const prevCrossroads = isCrossroads(edgesObj, +edgeKey, 'next');
          // @ts-ignore
          res[edgeKey] = {
            ...edgeObj,
            nextCrossroads,
            prevCrossroads,
          };
        });

        return {...layer, ...{edges: res}};
      });

      MAP = {...state.MAP, ...{...conf.MAP, ...{layers: mockedMapLayers}}};
    }
    if (MAP != null) {
      if (MAP.controls) {
        MAP.controls = {...addIdToControls(MAP.controls)};
      }
    }
    return {
      ...conf,
      ...{
        APP: {...state.APP, ...conf.APP},
        WEBAPP: {...state.WEBAPP, ...conf.WEBAPP},
        THEME: {...state.THEME, ...conf.THEME},
        OPTIONS: {...state.OPTIONS, ...conf.OPTIONS},
        MAP,
      },
    };
  }),
);

const addIdToControls = (controls: ICONTROLS): ICONTROLS => {
  /*   let mockup = {};

  if (controls.tiles) {
    const tiles = controls.tiles.map((tile, index) =>
      index === 3 ? {...tile, default: true} : tile,
    );
    mockup = {...mockup, ...{tiles}};
  }
  if (controls.overlays) {
    const overlays = controls.overlays.map((overlay, index) =>
      index === 2 ? {...overlay, default: true} : overlay,
    );
    mockup = {...mockup, ...{overlays}};
  }
  controls = {
    ...controls,
    ...{
      data: [
        {label: {'it': 'Dati', 'en': 'Data'}, type: 'title'},
        {
          label: {'it': 'Pois', 'en': 'Pois'},
          type: 'button',
          url: 'pois',
          default: false,
          icon: layersSVG,
        },
        {
          label: {'it': 'Tracce', 'en': 'Tracce'},
          type: 'button',
          url: 'layers',
          default: false,
          icon: layersSVG,
        },
      ],
    },
    ...mockup,
  };
 */
  const keys = Object.keys(controls);
  let controlsWithIDs = {...controls};
  keys.forEach(key => {
    controlsWithIDs[key] = controlsWithIDs[key].map((c, index) => {
      if (c.type === 'button') {
        return {...c, ...{id: index}};
      }
      return c;
    });
  });
  return controlsWithIDs;
};

const isCrossroads = (
  edges: {[trackID: string]: {prev: number[]; next: number[]}},
  trackID: number,
  trend: 'prev' | 'next' = 'prev',
): boolean => {
  let count = 0;
  const keys = Object.keys(edges).filter(k => +k != trackID);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const edge = edges[key];
    const tracks = [...edge.prev, ...edge.next];
    for (const track of edge[trend]) {
      if (track === trackID) {
        count++;
      }
      if (count > 1) {
        return true;
      }
    }
  }

  return false;
};
export const layersSVG = `<?xml version="1.0" encoding="iso-8859-1"?>
<!-- Uploaded to: SVG Repo, www.svgrepo.com, Generator: SVG Repo Mixer Tools -->
<svg fill="#000000" height="800px" width="800px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
	 viewBox="0 0 512 512" xml:space="preserve">
<g>
	<g>
		<path d="M437.4,281.224h-21.046c16.833-34.58,28.023-67.206,28.023-92.847c0-18.316-2.624-36.425-7.802-53.82
			c-1.268-4.259-5.747-6.682-10.012-5.419c-4.261,1.269-6.687,5.75-5.419,10.012c4.734,15.904,7.134,32.466,7.134,49.227
			c0,85.29-140.794,263.973-172.277,302.857C224.517,452.35,83.723,273.668,83.723,188.377c0-94.994,77.283-172.277,172.277-172.277
			c65.227,0,124.115,36.151,153.686,94.345c2.015,3.965,6.86,5.544,10.824,3.53c3.963-2.015,5.544-6.861,3.53-10.824
			c-15.519-30.541-39.089-56.31-68.164-74.526C325.981,9.9,291.444,0,256,0C157.613,0,76.615,75.82,68.334,172.096
			c-28.133,3.128-50.087,27.042-50.087,55.996v12.881c0,31.072,25.28,56.352,56.352,56.352h29.205
			c16.907,32.145,37.839,65.281,58.534,95.53h-81.3c-31.072,0-56.352,25.28-56.352,56.352v6.44C24.688,486.72,49.968,512,81.04,512
			h172.813c4.341,0,9.685-4.342,12.328-7.737c16.117-20.708,40.306-49.843,72.37-95.402c0.383,0.056,0.773,0.094,1.172,0.094H437.4
			c31.072,0,56.352-25.28,56.352-56.352v-15.027C493.753,306.504,468.472,281.224,437.4,281.224z M74.6,281.224
			c-22.195,0-40.252-18.056-40.252-40.252v-12.881c0-19.814,14.396-36.32,33.276-39.634c0.024,25.628,11.206,58.222,28.022,92.766
			H74.6z M81.04,495.899c-22.195,0-40.252-18.056-40.252-40.252v-6.44c0-22.195,18.056-40.252,40.252-40.252h92.476
			c26.737,37.984,51.744,69.845,65.512,86.943H81.04z M477.652,352.604c0,22.195-18.056,40.252-40.252,40.252h-87.74
			c20.696-30.25,41.628-63.385,58.534-95.53H437.4c22.195,0,40.252,18.056,40.252,40.252V352.604z"/>
	</g>
</g>
<g>
	<g>
		<path d="M256,40.788c-81.38,0-147.589,66.209-147.589,147.589c0,13.892,1.93,27.644,5.735,40.872
			c1.23,4.272,5.692,6.743,9.962,5.512c4.272-1.23,6.74-5.69,5.512-9.962c-3.39-11.782-5.108-24.036-5.108-36.422
			c0-72.503,58.985-131.488,131.488-131.488s131.488,58.985,131.488,131.488S328.503,319.866,256,319.866
			c-48.242,0-92.539-26.357-115.604-68.783c-2.123-3.906-7.011-5.353-10.917-3.228c-3.907,2.123-5.351,7.011-3.228,10.917
			c25.884,47.615,75.602,77.194,129.749,77.194c81.38,0,147.589-66.209,147.589-147.589S337.38,40.788,256,40.788z"/>
	</g>
</g>
<g>
	<g>
		<path d="M350.457,115.925H161.543c-4.447,0-8.05,3.603-8.05,8.05v137.392c0,4.447,3.603,8.05,8.05,8.05h188.914
			c4.447,0,8.05-3.603,8.05-8.05V123.975C358.507,119.528,354.904,115.925,350.457,115.925z M218.969,132.025h26.834v44.008h-26.834
			V132.025z M299.472,253.317H169.593V132.025h33.275v52.059c0,4.447,3.603,8.05,8.05,8.05h42.935c4.447,0,8.05-3.603,8.05-8.05
			v-52.059h37.568V253.317z M342.407,253.317h-26.834V132.025h26.834V253.317z"/>
	</g>
</g>
<g>
	<g>
		<path d="M281.761,206.088h-92.31c-4.447,0-8.05,3.603-8.05,8.05s3.603,8.05,8.05,8.05h92.31c4.447,0,8.05-3.603,8.05-8.05
			S286.208,206.088,281.761,206.088z"/>
	</g>
</g>
<g>
	<g>
		<path d="M281.761,229.702h-92.31c-4.447,0-8.05,3.603-8.05,8.05s3.603,8.05,8.05,8.05h92.31c4.447,0,8.05-3.603,8.05-8.05
			S286.208,229.702,281.761,229.702z"/>
	</g>
</g>
</svg>`;
