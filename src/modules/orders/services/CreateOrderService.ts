import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) { }

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('Customer not found');
    }

    const productsArrayRepository = await this.productsRepository.findAllById(
      products,
    );

    products.forEach(product => {
      const productIndex = productsArrayRepository.findIndex(
        p => p.id === product.id,
      );

      if (!product.quantity) {
        throw new AppError('Quantidade invalida', 400);
      }

      if (productsArrayRepository[productIndex].quantity < product.quantity) {
        throw new AppError('Quantidade maior que estoque', 400);
      }
    });

    const productsArray = products.map(product => {
      const productIndex = productsArrayRepository.findIndex(
        p => p.id === product.id,
      );
      return {
        product_id: product.id,
        price: productsArrayRepository[productIndex].price,
        quantity: product.quantity,
      };
    });

    await this.productsRepository.updateQuantity(products);

    const order = await this.ordersRepository.create({
      customer,
      products: productsArray,
    });

    return order;
  }
}

export default CreateOrderService;
