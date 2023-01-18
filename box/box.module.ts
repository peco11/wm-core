import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {IonicModule} from '@ionic/angular';
import {TranslateModule} from '@ngx-translate/core';
import {SharedModule} from 'src/app/components/shared/shared.module';
import {PipeModule} from '../pipes/pipe.module';
import {WmSharedModule} from '../shared/shared.module';
import {BaseBoxComponent} from './box';
import {ExternalUrlBoxComponent} from './external-url-box/external-url-box.component';
import {LayerBoxComponent} from './layer-box/layer-box.component';
import {PoiBoxComponent} from './poi-box/poi-box.component';
import {SearchBoxComponent} from './search-box/search-box.component';
import {SliderBoxComponent} from './slider-box/slider-box.component';
import {SlugBoxComponent} from './slug-box/slug-box.component';
import {TrackBoxComponent} from './track-box/track-box.component';

const boxComponents = [
  LayerBoxComponent,
  SearchBoxComponent,
  ExternalUrlBoxComponent,
  SliderBoxComponent,
  BaseBoxComponent,
  SlugBoxComponent,
  PoiBoxComponent,
  TrackBoxComponent,
];
@NgModule({
  declarations: boxComponents,
  imports: [CommonModule, IonicModule, WmSharedModule, PipeModule, TranslateModule, SharedModule],
  exports: boxComponents,
})
export class BoxModule {}