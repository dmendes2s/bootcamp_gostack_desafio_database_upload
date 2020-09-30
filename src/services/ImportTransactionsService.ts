import { getRepository, In } from 'typeorm';
import csvParse from 'csv-parse';
import fs from 'fs';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface CSVTransaction {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class ImportTransactionsService {
  private transactions: object[];

  async execute(filePath: string): Promise<Transaction[]> {
    const stream = fs.createReadStream(filePath);
    const parsers = csvParse({
      from_line: 2,
    });

    const categoriesRepository = getRepository(Category);
    const transactionRepository = getRepository(Transaction);

    const parseCsv = stream.pipe(parsers);

    const transactions: CSVTransaction[] = [];
    const categories: string[] = [];

    parseCsv.on('data', async row => {
      const [title, type, value, category] = row.map((cell: string) =>
        cell.trim(),
      );

      if (!title || !type || !value) return;

      transactions.push({
        title,
        type,
        value,
        category,
      });

      categories.push(category);
    });

    await new Promise(resolve => parseCsv.on('end', resolve));

    const existsCategories = await categoriesRepository.find({
      where: {
        title: In(categories),
      },
    });

    const categoriesTitle = existsCategories.map(category => category.title);

    const addCategoryTitles = categories
      .filter(category => !categoriesTitle.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    const newCategories = categoriesRepository.create(
      addCategoryTitles.map(title => ({ title })),
    );

    await categoriesRepository.save(newCategories);

    const finalCategories = [...newCategories, ...existsCategories];

    const createdTransaction = transactionRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: finalCategories.find(
          category => category.title === transaction.title,
        ),
      })),
    );

    await transactionRepository.save(createdTransaction);

    await fs.promises.unlink(filePath);

    return createdTransaction;
  }
}

export default ImportTransactionsService;
