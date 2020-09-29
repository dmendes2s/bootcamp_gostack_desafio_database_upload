import { getRepository } from 'typeorm';

// import AppError from '../errors/AppError';
import Transaction from '../models/Transaction';

class DeleteTransactionService {
  public async execute(id: string): Promise<void> {
    const repository = getRepository(Transaction);

    await repository.delete(id);
  }
}

export default DeleteTransactionService;
