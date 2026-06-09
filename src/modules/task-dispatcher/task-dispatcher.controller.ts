import { Controller, Post, Body } from '@nestjs/common';
import { TaskDispatcherService } from './task-dispatcher.service';

@Controller('task-dispatcher')
export class TaskDispatcherController {
  constructor(private readonly dispatcherService: TaskDispatcherService) {}

  @Post('dispatch')
  async dispatchJob(
    @Body('meetingId') meetingId: string,
    @Body('fileUrl') fileUrl: string,
  ) {
    return this.dispatcherService.sendToQueue(meetingId, fileUrl);
  }
}