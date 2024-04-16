import './scss/styles.scss';

import { ShopApi } from './components/ShopAPI';
import { API_URL, CDN_URL, settings } from './utils/constants';
import { EventEmitter } from './components/base/events';
import { AppState, CatalogChangeEvent } from './components/AppData';
import { IProductItem } from './types';
import { Page } from './components/Page';
import { Modal } from './components/common/Modal';
import { Basket } from './components/common/Basket';
import { Card, CardCompact, CardPreview } from './components/Card';
import { cloneTemplate, ensureElement } from './utils/utils';

const events = new EventEmitter();
const api = new ShopApi(CDN_URL, API_URL);

// Чтобы мониторить все события, для отладки
events.onAll(({ eventName, data }) => {
	console.log(eventName, data);
});

//Все шаблоны
const cardCatalogTemplate = ensureElement<HTMLTemplateElement>('#card-catalog');
const cardPreviewTemplate = ensureElement<HTMLTemplateElement>('#card-preview');
const cardBasketTemplate = ensureElement<HTMLTemplateElement>('#card-basket');
const basketTemplate = ensureElement<HTMLTemplateElement>('#basket');

// Модель данных приложения
const appData = new AppState({}, events);

// Глобальные контейнеры
const page = new Page(document.body, events);
const modal = new Modal(ensureElement<HTMLElement>('#modal-container'), events);

const basket = new Basket(cloneTemplate(basketTemplate), events);

// Изменились элементы каталога
events.on<CatalogChangeEvent>('items:changed', () => {
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
		api
			.getProductItem(item.id)
			.then((result) => {
				item = { ...result };

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
			})
			.catch((err) => console.error(err));
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
