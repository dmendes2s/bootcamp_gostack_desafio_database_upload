// import csv from 'csv-parser';
import fs from 'fs';
import path from 'path';
import neatCsv from 'neat-csv';

import CreateTransactionService from './CreateTransactionService';

// import Transaction from '../models/Transaction';

interface CSV {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class ImportTransactionsService {
  private transactions: object[];

  async execute(filename: string): Promise<CSV[]> {
    const service = new CreateTransactionService();

    const transactions = await this.readFile(filename);

    async function executeService(): Promise<void> {
      for(const transaction of transactions) {
        await service.execute({
          title: transaction.title,
          category: transaction.category,
          type: transaction.type,
          value: transaction.value,
        });
      }
    }

    executeService();

    return transactions;
  }

  private readFile(filename: string): Promise<CSV[]> {
    return new Promise((resolve, reject) => {
      const pathFile = path.resolve(__dirname, '..', '..', 'tmp', filename);
      // const stream = fs.createReadStream(pathFile).pipe(csv());

      fs.readFile(pathFile, async (err, data) => {
        if (err) {
          reject(err);
        }
        const transactions = await neatCsv<CSV>(data);
        resolve(transactions);
      });

      // stream.on('data', chunk => {
      //   // data.push(chunk);
      //   // this.transactions.push(chunk);
      //   // data += chunk;
      //   return chunk;
      // });
      // stream.on('end', () => resolve(data));
      // stream.on('error', error => reject(error));
    });
  }
}

export default ImportTransactionsService;
