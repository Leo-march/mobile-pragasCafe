// src/app/app.module.ts
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
  locationOutline, callOutline, checkmarkCircle, flash, playCircle,
  cameraOutline, trendingUp, mapOutline, checkboxOutline, bulb,
  flag, camera, createOutline, trashOutline, timeOutline, location,
  flagOutline, addCircle, create, trash, chevronBackOutline,
  arrowForwardCircle, close, checkmark, refresh, alertCircle,
  playSkipForward, informationCircle, closeCircle
} from 'ionicons/icons';

addIcons({
  'cafe': cafe,
  'mail-outline': mailOutline,
  'lock-closed-outline': lockClosedOutline,
  'eye-outline': eyeOutline,
  'eye-off-outline': eyeOffOutline,
  'arrow-forward': arrowForward,
  'person-add-outline': personAddOutline,
  'chevron-back': chevronBack,
  'person-outline': personOutline,
  'location-outline': locationOutline,
  'call-outline': callOutline,
  'checkmark-circle': checkmarkCircle,
  'flash': flash,
  'play-circle': playCircle,
  'camera-outline': cameraOutline,
  'trending-up': trendingUp,
  'map-outline': mapOutline,
  'checkbox-outline': checkboxOutline,
  'bulb': bulb,
  'flag': flag,
  'camera': camera,
  'create-outline': createOutline,
  'trash-outline': trashOutline,
  'time-outline': timeOutline,
  'location': location,
  'flag-outline': flagOutline,
  'add-circle': addCircle,
  'create': create,
  'trash': trash,
  'chevron-back-outline': chevronBackOutline,
  'arrow-forward-circle': arrowForwardCircle,
  'close': close,
  'checkmark': checkmark,
  'refresh': refresh,
  'alert-circle': alertCircle,
  'play-skip-forward': playSkipForward,
  'information-circle': informationCircle,
  'close-circle': closeCircle,
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