import { Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { Todo } from './todo.model';

const INDEX = 'todos';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  async getTodos(): Promise<Todo[]> {
    await this.deleteIndex(INDEX);
    await this.createIndex(INDEX);
    await this.addLowercaseNormalizer(INDEX);
    await this.updateMapping(INDEX);

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

    const searchResult = await this.elasticsearchService.search<Todo>({
      index: INDEX,
      body: {
        query: {
          match: {
            title: 'test',
          },
        },
      },
    });

    this.logger.debug(searchResult);

    return searchResult.body.documents;
  }

  async createIndex(index: string): Promise<void> {
    this.logger.log(`Creating ${index} index`);
    await this.elasticsearchService.indices.create({ index });
  }

  async addLowercaseNormalizer(index: string): Promise<void> {
    this.logger.log(`Closing ${index} index`);
    await this.elasticsearchService.indices.close({ index });

    this.logger.log(`Adding lowercase normalizer to ${index} index`);
    await this.elasticsearchService.indices.putSettings({
      index,
      body: {
        index: {
          settings: {
            analysis: {
              normalizer: {
                lowercase_normalizer: {
                  type: 'custom',
                  char_filter: [],
                  filter: ['lowercase'],
                },
              },
            },
          },
        },
      },
    });

    this.logger.log(`Opening ${index} index`);
    await this.elasticsearchService.indices.open({ index });
  }

  async updateMapping(index: string): Promise<void> {
    this.logger.log(`Updating mapping for ${index} index`);
    // id: string;
    // name: string;
    // description: string;
    // done: boolean;
    await this.elasticsearchService.indices.putMapping({
      index,
      body: {
        properties: {
          id: {
            type: 'keyword',
          },
          title: {
            type: 'text',
            fields: {
              keyword: {
                type: 'keyword',
              },
              lowercase: {
                type: 'keyword',
                normalizer: 'lowercase_normalizer',
              },
              en: {
                type: 'text',
                analyzer: 'english',
              },
              de: {
                type: 'text',
                analyzer: 'german',
              },
            },
          },
          description: {
            type: 'text',
            fields: {
              keyword: {
                type: 'keyword',
              },
              lowercase: {
                type: 'keyword',
                normalizer: 'lowercase_normalizer',
              },
              en: {
                type: 'text',
                analyzer: 'english',
              },
              de: {
                type: 'text',
                analyzer: 'german',
              },
            },
          },
          done: {
            type: 'boolean',
          },
        },
      },
    });
  }

  async deleteIndex(index: string): Promise<void> {
    const exists = await this.elasticsearchService.indices.exists({ index });

    if (exists.body) {
      this.logger.log(`Deleting ${index} index`);
      await this.elasticsearchService.indices.delete({ index });
    } else {
      this.logger.warn(`Index ${index} not found`);
    }
  }
}
