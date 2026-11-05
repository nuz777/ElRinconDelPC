import { Injectable } from '@nestjs/common';
import { HashingService as IHashingService } from '../../Domain/services/hashing.service.js';
import { HashingService } from '../security/hashing.service.js';

@Injectable()
export class HashingServiceAdapter implements IHashingService {
  constructor(private readonly hashingService: HashingService) {}

  async hash(plainText: string): Promise<string> {
    return this.hashingService.hash(plainText);
  }

  async compare(plainText: string, hash: string): Promise<boolean> {
    return this.hashingService.compare(plainText, hash);
  }
}
