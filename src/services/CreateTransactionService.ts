import { getRepository, getCustomRepository } from 'typeorm';

import Category from '../models/Category';
import AppError from '../errors/AppError';
import Transaction from '../models/Transaction';
import TransactionRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {

    // if (type !== 'income' && type !== 'outcome') {
    //   throw new AppError('Invalid type action, use income or outcome', 400);
    // }

    const transactionRepository = getCustomRepository(TransactionRepository);
    let newTransaction: Transaction;

    if (type === 'outcome') {
      const balance = await transactionRepository.getBalance();

      if (value > balance.total) {
        throw new AppError('Saldo insuficiente para essa transação');
      }

      newTransaction = await this.createTransaction({
        title,
        value,
        type,
        category,
      });
    } else {
      newTransaction = await this.createTransaction({
        title,
        value,
        type,
        category,
      });
    }

    const transaction = await transactionRepository.save(newTransaction);

    return transaction;
  }

  private async createTransaction({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionRepository = getCustomRepository(TransactionRepository);
    const categoryRepository = getRepository(Category);

    let categoryModel: Category;
    const categoryExists = await categoryRepository.findOne({
      where: {
        title: category,
      },
    });

    if (categoryExists) {
      categoryModel = categoryExists;
    } else {
      const newCategory = categoryRepository.create({
        title: category,
      });

      categoryModel = await categoryRepository.save(newCategory);
    }

    const newTransaction = transactionRepository.create({
      title,
      value,
      type,
      category_id: categoryModel.id,
    });

    return newTransaction;
  }
}

export default CreateTransactionService;
