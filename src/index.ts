import './scss/styles.scss';

import { ShopApi } from './components/ShopAPI';
import { API_URL, CDN_URL, settings } from './utils/constants';
import { EventEmitter } from './components/base/Events';
import { AppState, defaultOrderState } from './components/AppData';
import { IProductItem, IOrderForm } from './types';
import { Page } from './components/Page';
import { Modal } from './components/common/Modal';
import { Basket } from './components/common/Basket';
import { Success } from './components/common/Success';
import { Order, Contacts } from './components/Order';
import { Card, CardCompact, CardPreview } from './components/Card';
import { cloneTemplate, ensureElement } from './utils/utils';

const events = new EventEmitter();
const api = new ShopApi(CDN_URL, API_URL);

//Все шаблоны
const cardCatalogTemplate = ensureElement<HTMLTemplateElement>('#card-catalog');
const cardPreviewTemplate = ensureElement<HTMLTemplateElement>('#card-preview');
const cardBasketTemplate = ensureElement<HTMLTemplateElement>('#card-basket');
const basketTemplate = ensureElement<HTMLTemplateElement>('#basket');
const orderFormTemplate = ensureElement<HTMLTemplateElement>('#order');
const contactsFormTemplate = ensureElement<HTMLTemplateElement>('#contacts');
const successTemplate = ensureElement<HTMLTemplateElement>('#success');

// Модель данных приложения
const appData = new AppState({}, events);

// Глобальные контейнеры
const page = new Page(document.body, events);
const modal = new Modal(ensureElement<HTMLElement>('#modal-container'), events);

// Переиспользуемые части интерфейса
const basket = new Basket(cloneTemplate(basketTemplate), events);
const order = new Order(cloneTemplate(orderFormTemplate), events, {
	onClick: (event: MouseEvent) => {
		const targetName = (event.target as HTMLButtonElement).name;
		order.payment = targetName;
	},
});
const contacts = new Contacts(cloneTemplate(contactsFormTemplate), events);

// Изменились элементы каталога
events.on('items:changed', () => {
	page.catalog = appData.catalog.map((item) => {
		const card = new Card('card', cloneTemplate(cardCatalogTemplate), {
			onClick: () => events.emit('card:select', item),
		});
		card.id = item.id;
		return card.render({
			category: item.category,
			title: item.title,
			image: item.image,
			price: item.price,
		});
	});

	page.counter = appData.getOrderItems().length;
});

// Открыть карточку товара
events.on('card:select', (item: IProductItem) => {
	appData.setPreview(item);
});

// Изменена открытая выбранная карточка товара
events.on('preview:changed', (item: IProductItem) => {
	const card = new CardPreview(cloneTemplate(cardPreviewTemplate), {
		onClick: () => {
			appData.addItemToBasket(item);
			modal.close();
		},
	});
	if (item) {
		if (appData.isItemAvailable(item) && !appData.isItemInBasket(item)) {
			card.blockAddButton(false);
		} else {
			card.blockAddButton(true);
		}

		modal.render({
			content: card.render({
				category: item.category,
				title: item.title,
				image: item.image,
				price: item.price,
				description: item.description,
			}),
		});
	} else {
		modal.close();
	}
});

//Изменилось состояние корзины (добавили или удалили товар)
events.on('basket:changed', () => {
	const orderItems = appData.getOrderItems();
	page.counter = orderItems.length;
	basket.items = orderItems.map((item, index) => {
		const card = new CardCompact(cloneTemplate(cardBasketTemplate), {
			onClick: () => {
				appData.deleteItemFromBasket(item);
			},
		});

		return card.render({
			index: String(index + 1),
			title: item.title,
			price: item.price,
		});
	});
	basket.total = appData.getTotal();
});

// Изменилось состояние валидации форм
events.on('formErrors:change', (errors: Partial<IOrderForm>) => {
	const { payment, email, phone, address } = errors;
	order.valid = !payment && !address;
	order.errors = Object.values({ payment, address })
		.filter((i) => !!i)
		.join('; ');
	contacts.valid = !email && !phone;
	contacts.errors = Object.values({ email, phone })
		.filter((i) => !!i)
		.join('; ');
});

// Изменилось одно из полей
events.on(
	/^(order\..*|contacts\..*):change/,
	(data: { field: keyof IOrderForm; value: string }) => {
		appData.setOrderField(data.field, data.value);
	}
);

//Открыть форму заказа
events.on('order:open', () => {
	appData.order = Object.assign({}, defaultOrderState, {
		items: appData.order.items,
	});
	modal.render({
		content: order.render({
			payment: '',
			address: '',
			valid: false,
			errors: [],
		}),
	});
	appData.order.total = appData.getTotal();
});

//Успешно заполнили данные для заказа, переходим к заполнению контактных данных
events.on('order:submit', () => {
	modal.render({
		content: contacts.render({
			phone: '',
			email: '',
			valid: false,
			errors: [],
		}),
	});
});

//Отправляем заказ
events.on('contacts:submit', () => {
	api
		.orderItem(appData.order)
		.then(() => {
			const success = new Success(cloneTemplate(successTemplate), {
				onClick: () => {
					modal.close();
					appData.clearBasket();
					order.payment = '';
				},
			});

			modal.render({
				content: success.render({
					total: appData.order.total,
				}),
			});

			appData.clearBasket();
			order.payment = '';
		})
		.catch((err) => console.error(err));
});

//Открытие корзины
events.on('basket:open', () => {
	modal.render({
		content: basket.render(),
	});
});

// Блокируем прокрутку страницы если открыта модалка
events.on('modal:open', () => {
	page.locked = true;
});

// ... и разблокируем, когда модалка закрыта
events.on('modal:close', () => {
	page.locked = false;
});

// Получаем каталог товаров с сервера
api
	.getProductItemList()
	.then(appData.setCatalog.bind(appData))
	.catch((err) => console.error(err));
