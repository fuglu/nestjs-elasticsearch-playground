import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Todo } from './todo.model';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getTodos(): Promise<Todo[]> {
    return this.appService.getTodos();
  }
}
