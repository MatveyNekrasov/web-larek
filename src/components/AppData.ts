import { Model } from './base/Model';
import {
	FormErrors,
	IAppState,
	IProductItem,
	IOrder,
	IOrderForm,
} from '../types';

export const defaultOrderState: IOrder = {
	items: [],
	email: '',
	phone: '',
	address: '',
	payment: '',
	total: 0,
};

export class AppState extends Model<IAppState> {
	catalog: IProductItem[];
	preview: string | null;
	order: IOrder = Object.assign({}, defaultOrderState);
	formErrors: FormErrors = {};

	setCatalog(items: IProductItem[]) {
		this.catalog = items;
		this.emitChanges('items:changed', { catalog: this.catalog });
	}

	setPreview(item: IProductItem) {
		this.preview = item.id;
		this.emitChanges('preview:changed', item);
	}

	addItemToBasket(item: IProductItem) {
		this.order.items.push(item.id);
		this.emitChanges('basket:changed', item);
	}

	deleteItemFromBasket(item: IProductItem) {
		this.order.items = this.order.items.filter(
			(orderItem) => orderItem !== item.id
		);
		this.emitChanges('basket:changed', item);
	}

	clearBasket() {
		this.order = Object.assign({}, defaultOrderState, {
			items: [],
		});
		this.emitChanges('basket:changed');
	}

	isItemInBasket(item: IProductItem) {
		if (this.order.items.includes(item.id)) {
			return true;
		}
		return false;
	}

	isItemAvailable(item: IProductItem) {
		if (item.price) {
			return true;
		}
		return false;
	}

	getOrderItems() {
		return this.catalog.filter((item) => this.order.items.includes(item.id));
	}

	getTotal() {
		return this.order.items.reduce(
			(a, c) => a + this.catalog.find((it) => it.id === c).price,
			0
		);
	}

	setOrderField(field: keyof IOrderForm, value: string) {
		this.order[field] = value;

		if (this.validateOrder()) {
			this.emitChanges('order:ready', this.order);
		}
	}

	validateOrder() {
		const errors: typeof this.formErrors = {};
		if (!this.order.payment) {
			errors.payment = 'Необходимо выбрать способ оплаты';
		}
		if (!this.order.address) {
			errors.address = 'Необходимо указать адрес';
		}
		if (!this.order.email) {
			errors.email = 'Необходимо указать email';
		}
		if (!this.order.phone) {
			errors.phone = 'Необходимо указать телефон';
		}

		this.formErrors = errors;
		this.emitChanges('formErrors:change', this.formErrors);
		return Object.keys(errors).length === 0;
	}
}
