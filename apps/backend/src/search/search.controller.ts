import { Controller, Get, Query } from '@nestjs/common';
import { CurrentUser, ZenithUser } from '../auth/current-user.decorator';
import { SearchService, SearchHitType } from './search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  /**
   * GET /search?q=finan&types=goal,database&limit=10
   *
   * Busca unificada em metas, tarefas, rotinas, páginas, databases,
   * compromissos e linhas de database. Retorna resultados agrupados
   * por tipo, ordenados por relevância.
   *
   * Requer JWT — usado pelo GlobalSearch e pela tool `search` do AgentService.
   */
  @Get()
  async search(
    @CurrentUser() user: ZenithUser,
    @Query('q') q: string,
    @Query('types') types?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedTypes = types
      ? (types.split(',').filter((t) => t.trim()) as SearchHitType[])
      : undefined;
    const parsedLimit = limit ? Math.max(1, Math.min(50, parseInt(limit, 10))) : 10;
    return this.searchService.search(user.id, q || '', parsedTypes, parsedLimit);
  }
}
