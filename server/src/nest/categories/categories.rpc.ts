import { PluginController, PluginMethod } from '../../nest-rpc/rpc-kit/decorators';
import { CategoriesService } from './categories.service';

/**
 * The category surface a plugin may reach (#plugins). A global, read-only
 * reference list that carries no tenant data, so it needs neither an acting user
 * nor a trip gate.
 */
@PluginController()
export class CategoriesRpc {
  constructor(private readonly categories: CategoriesService) {}

  @PluginMethod('categories.list', { permission: 'db:read:categories' })
  async list(): Promise<unknown[]> {
    return (await this.categories.list()) as unknown[];
  }
}
