export interface IProductItem {
	id: string;
	title: string;
	description: string;
	category: string;
	image: string;
	price: number;
}

export interface IOrderForm {
	payment: string;
	email: string;
	phone: string;
	address: string;
}

export interface IOrder extends IOrderForm {
	items: string[];
}

export interface IOrderResult {
	id: string;
	total: number;
}

export interface IAppState {
	catalog: IProductItem[];
	preview: string | null;
	order: IOrder | null;
}

export type FormErrors = Partial<Record<keyof IOrder, string>>;
