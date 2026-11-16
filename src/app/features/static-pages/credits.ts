import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SITE_CONFIG } from '../../core/config/site-config';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header';

interface LogoCredit {
  name: string;
  owner: string;
  licence: string;
  licenceUrl: string;
  source: string;
}

const cc = (path: string): string => `https://creativecommons.org/licenses/${path}/`;

/** Logos whose licences ask for attribution. Every other logo is shown unmodified for identification only. */
const LOGO_CREDITS: readonly LogoCredit[] = [
  {
    name: 'Angular',
    owner: 'Google LLC',
    licence: 'CC BY 4.0',
    licenceUrl: cc('by/4.0'),
    source: 'https://angular.dev/press-kit',
  },
  {
    name: 'Gin',
    owner: 'Gin contributors',
    licence: 'CC BY 4.0',
    licenceUrl: cc('by/4.0'),
    source: 'https://github.com/gin-gonic/logo',
  },
  {
    name: 'Git',
    owner: 'Jason Long',
    licence: 'CC BY 3.0',
    licenceUrl: cc('by/3.0'),
    source: 'https://git-scm.com/downloads/logos',
  },
  {
    name: 'Jenkins',
    owner: 'Jenkins project',
    licence: 'CC BY-SA 3.0',
    licenceUrl: cc('by-sa/3.0'),
    source: 'https://www.jenkins.io/artwork/',
  },
  {
    name: 'NgRx',
    owner: 'NgRx maintainers',
    licence: 'CC BY 4.0',
    licenceUrl: cc('by/4.0'),
    source: 'https://ngrx.io',
  },
  {
    name: 'PHP',
    owner: 'Colin Viebrock and The PHP Group',
    licence: 'CC BY-SA 4.0',
    licenceUrl: cc('by-sa/4.0'),
    source: 'https://www.php.net/download-logos.php',
  },
  {
    name: 'R',
    owner: 'The R Foundation',
    licence: 'CC BY-SA 4.0',
    licenceUrl: cc('by-sa/4.0'),
    source: 'https://www.r-project.org/logo/',
  },
  {
    name: 'Ruby',
    owner: 'Yukihiro Matsumoto',
    licence: 'CC BY-SA 2.5',
    licenceUrl: cc('by-sa/2.5'),
    source: 'https://www.ruby-lang.org/en/about/logo/',
  },
  {
    name: 'Rust',
    owner: 'Rust Foundation',
    licence: 'CC BY 4.0',
    licenceUrl: cc('by/4.0'),
    source: 'https://foundation.rust-lang.org/policies/logo-policy-and-media-guide/',
  },
  {
    name: 'Sass',
    owner: 'Sass team',
    licence: 'CC BY-NC-SA 3.0',
    licenceUrl: cc('by-nc-sa/3.0'),
    source: 'https://sass-lang.com/styleguide/brand/',
  },
  {
    name: 'Solidity',
    owner: 'Solidity team',
    licence: 'CC BY 4.0',
    licenceUrl: cc('by/4.0'),
    source: 'https://soliditylang.org',
  },
  {
    name: 'Vue.js',
    owner: 'Evan You',
    licence: 'CC BY-NC-SA 4.0',
    licenceUrl: cc('by-nc-sa/4.0'),
    source: 'https://github.com/vuejs/art',
  },
];

const SOFTWARE: readonly { name: string; licence: string; url: string }[] = [
  {
    name: 'Manrope typeface by Mikhail Sharanda and contributors',
    licence: 'SIL Open Font License 1.1',
    url: 'https://github.com/sharanda/manrope',
  },
  { name: 'Angular', licence: 'MIT', url: 'https://angular.dev' },
  { name: 'Bootstrap and Bootstrap Icons', licence: 'MIT', url: 'https://getbootstrap.com' },
  { name: 'Devicon (technology logo set)', licence: 'MIT', url: 'https://devicon.dev' },
  { name: 'CodeMirror', licence: 'MIT', url: 'https://codemirror.net' },
  {
    name: 'sql.js (SQLite compiled to WebAssembly)',
    licence: 'MIT; SQLite is public domain',
    url: 'https://sql.js.org',
  },
  { name: 'Shiki', licence: 'MIT', url: 'https://shiki.style' },
  { name: 'MiniSearch', licence: 'MIT', url: 'https://lucaong.github.io/minisearch/' },
];

@Component({
  selector: 'cma-credits',
  imports: [RouterLink, PageHeaderComponent],
  template: `
    <cma-page-header
      eyebrow="Company"
      title="Credits and licences"
      lead="Where the logos come from, what their licences ask of us, and the open-source software this site is built with."
    />
    <div class="container-xxl py-4 py-lg-5">
      <div class="row justify-content-center">
        <div class="col-lg-9">
          <section aria-labelledby="logos-heading" class="mb-5">
            <h2 id="logos-heading" class="h4">Technology logos</h2>
            <p>
              Technology logos in the catalog come from the open-source
              <a href="https://devicon.dev" rel="noopener" target="_blank">Devicon</a> collection
              and are shown unmodified, purely to identify the technology a tutorial is about. The
              logos remain the property of their owners. Some owners publish their logo under a
              Creative Commons licence that asks for attribution, which is given here.
            </p>
            <div class="table-responsive">
              <table class="table align-middle caption-top cma-table">
                <caption>
                  Logos with attribution requirements
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Logo</th>
                    <th scope="col">Owner / author</th>
                    <th scope="col">Licence</th>
                    <th scope="col">Source</th>
                  </tr>
                </thead>
                <tbody>
                  @for (credit of credits; track credit.name) {
                    <tr>
                      <th scope="row">{{ credit.name }}</th>
                      <td>{{ credit.owner }}</td>
                      <td>
                        <a [href]="credit.licenceUrl" rel="noopener license" target="_blank">{{
                          credit.licence
                        }}</a>
                      </td>
                      <td>
                        <a [href]="credit.source" rel="noopener" target="_blank">Logo guidelines</a>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            <p class="small cma-text-secondary">
              The Sass and Vue.js logos are licensed for non-commercial use. {{ site.name }} is free
              to use and carries no advertising.
            </p>
          </section>

          <section aria-labelledby="trademarks-heading" class="mb-5">
            <h2 id="trademarks-heading" class="h4">Trademarks</h2>
            <p>
              Product names, logos and brands are property of their respective owners and are used
              for identification only. Their use does not imply that any project, company or
              foundation sponsors, endorses or is affiliated with {{ site.name }}.
            </p>
            <p class="mb-0">
              Redis is a registered trademark of Redis Ltd. Any rights therein are reserved to Redis
              Ltd. Any use by {{ site.name }} is for referential purposes only and does not indicate
              any sponsorship, endorsement or affiliation between Redis and {{ site.name }}.
            </p>
          </section>

          <section aria-labelledby="software-heading" class="mb-5">
            <h2 id="software-heading" class="h4">Open-source software</h2>
            <p>This site is built with and grateful to the following projects.</p>
            <ul class="mb-0">
              @for (item of software; track item.name) {
                <li>
                  <a [href]="item.url" rel="noopener" target="_blank">{{ item.name }}</a>
                  <span class="cma-text-secondary"> – {{ item.licence }}</span>
                </li>
              }
            </ul>
          </section>

          <section aria-labelledby="content-heading">
            <h2 id="content-heading" class="h4">Tutorial content</h2>
            <p class="mb-0">
              Every lesson, example, exercise and quiz on {{ site.name }} is written for this site.
              Found a mistake or a missing attribution? <a routerLink="/contact">Tell us</a> and we
              will fix it.
            </p>
          </section>
        </div>
      </div>
    </div>
  `,
})
export class CreditsPage {
  protected readonly site = inject(SITE_CONFIG);
  protected readonly credits = LOGO_CREDITS;
  protected readonly software = SOFTWARE;
}
