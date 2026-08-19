// Port of src/views/home.tsx
import { ChangeDetectionStrategy, Component } from '@angular/core';

import { homeContent } from '../../../data/home-content';
import { HeaderComponent } from '../header/header.component';
import { HeroComponent } from '../hero/hero.component';
import { AboutComponent } from '../about/about.component';
import { CreateBandComponent } from '../create-band/create-band.component';
import { PortfolioComponent } from '../portfolio/portfolio.component';
import { ServicesComponent } from '../services/services.component';
import { StatsComponent } from '../stats/stats.component';
import { FooterComponent } from '../footer/footer.component';
import { PageLoaderComponent } from '../../../shared/common/page-loader/page-loader.component';
import { NavMenuComponent } from '../../../shared/common/nav-menu/nav-menu.component';
import { RequestModalComponent } from '../../../shared/common/request-modal/request-modal.component';

@Component({
  selector: 'app-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HeaderComponent,
    HeroComponent,
    AboutComponent,
    CreateBandComponent,
    PortfolioComponent,
    ServicesComponent,
    StatsComponent,
    FooterComponent,
    PageLoaderComponent,
    NavMenuComponent,
    RequestModalComponent,
  ],
  templateUrl: './home.component.html',
})
export class HomeComponent {
  protected readonly content = homeContent;
}
