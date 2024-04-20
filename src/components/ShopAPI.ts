import { Api } from './base/Api';
import { IOrder, IProductItem, IOrderResult, ApiListResponse } from '../types/';

export interface IShopApi {
	getProductItemList: () => Promise<IProductItem[]>;
	getProductItem: (id: string) => Promise<IProductItem>;
	orderItem: (order: IOrder) => Promise<IOrderResult>;
}

export class ShopApi extends Api implements IShopApi {
	readonly cdn: string;

	constructor(cdn: string, baseURL: string, options?: RequestInit) {
		super(baseURL, options);
		this.cdn = cdn;
	}

	getProductItemList(): Promise<IProductItem[]> {
		return this.get('/product').then((data: ApiListResponse<IProductItem>) =>
			data.items.map((item) => ({
				...item,
				image: this.cdn + item.image,
			}))
		);
	}

	getProductItem(id: string): Promise<IProductItem> {
		return this.get(`/product/${id}`).then((item: IProductItem) => ({
			...item,
			image: this.cdn + item.image,
		}));
	}

	orderItem(order: IOrder): Promise<IOrderResult> {
		return this.post('/order', order).then((data: IOrderResult) => data);
	}
}
