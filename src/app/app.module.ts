import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './services/auth.interceptor';
import { addIcons } from 'ionicons';
import {
  cafe, mailOutline, lockClosedOutline, eyeOutline, eyeOffOutline,
  arrowForward, personAddOutline, chevronBack, personOutline,
  locationOutline, callOutline, checkmarkCircle, mapOutline,
  cameraOutline, camera, trendingUp, checkboxOutline, bulb,
  flagOutline, createOutline, trashOutline, chevronForwardOutline,
  imagesOutline, informationCircle, timeOutline, ellipseOutline,
  alertCircle, closeCircle, flag, close, playSkipForward, refresh,
  checkmark
} from 'ionicons/icons';

addIcons({
  cafe, 'mail-outline': mailOutline, 'lock-closed-outline': lockClosedOutline,
  'eye-outline': eyeOutline, 'eye-off-outline': eyeOffOutline,
  'arrow-forward': arrowForward, 'person-add-outline': personAddOutline,
  'chevron-back': chevronBack, 'person-outline': personOutline,
  'location-outline': locationOutline, 'call-outline': callOutline,
  'checkmark-circle': checkmarkCircle, 'map-outline': mapOutline,
  'camera-outline': cameraOutline, camera, 'trending-up': trendingUp,
  'checkbox-outline': checkboxOutline, bulb, 'flag-outline': flagOutline,
  'create-outline': createOutline, 'trash-outline': trashOutline,
  'chevron-forward-outline': chevronForwardOutline,
  'images-outline': imagesOutline, 'information-circle': informationCircle,
  'time-outline': timeOutline, 'ellipse-outline': ellipseOutline,
  'alert-circle': alertCircle, 'close-circle': closeCircle,
  flag, close, 'play-skip-forward': playSkipForward, refresh, checkmark
});

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    HttpClientModule
  ],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}