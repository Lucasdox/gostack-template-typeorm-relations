import { getRepository, Repository, In } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = this.ormRepository.create({ name, price, quantity });
    await this.ormRepository.save(product);

    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const product = await this.ormRepository.findOne({
      where: {
        name,
      },
    });

    return product;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const productsArray = await this.ormRepository.findByIds(
      products.map(product => product.id),
    );

    return productsArray;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    let stockProducts = await this.ormRepository.findByIds(products);
    stockProducts.forEach(async stockProduct => {
      const productIndex = products.findIndex(
        product => product.id === stockProduct.id,
      );
      stockProduct.quantity -= products[productIndex].quantity;
      await this.ormRepository.save(stockProduct);
    });
    stockProducts = await this.ormRepository.findByIds(products);

    return stockProducts;
  }
}

export default ProductsRepository;
