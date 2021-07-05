import { Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { Todo } from './todo.model';

const INDEX = 'todos';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  async getTodos(): Promise<Todo[]> {
    const todo: Todo = {
      id: '1',
      name: 'Test elasticsearch',
      description:
        'Use new @nestjs/elasticsearch module and check if TypeScript type definitions are used correctly',
      done: true,
    };

    const indexResult = await this.elasticsearchService.index({
      index: INDEX,
      id: todo.id,
      body: todo,
    });

    this.logger.debug(indexResult);

    const getResult = await this.elasticsearchService.get<Todo>({
      index: INDEX,
      id: todo.id,
    });

    this.logger.debug(getResult);

    return [todo];
  }
}
