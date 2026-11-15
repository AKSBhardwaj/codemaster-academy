import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { CONTENT_SOURCE } from './content/loader/content-source';
import { NodeContentSource } from './content/loader/node-content-source';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    // During prerendering and dev SSR, compiled content is read from disk (.generated/content).
    { provide: CONTENT_SOURCE, useClass: NodeContentSource },
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
