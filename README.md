# Проектная работа "Веб-ларек"

Стек: HTML, SCSS, TS, Webpack

Структура проекта:

- src/ — исходные файлы проекта
- src/components/ — папка с JS компонентами
- src/components/base/ — папка с базовым кодом
- src/components/common/ - папка с кодом переиспользуемых классов представления

Важные файлы:

- src/pages/index.html — HTML-файл главной страницы
- src/types/index.ts — файл с типами
- src/index.ts — точка входа приложения
- src/scss/styles.scss — корневой файл стилей
- src/utils/constants.ts — файл с константами
- src/utils/utils.ts — файл с утилитами

## Установка и запуск

Для установки и запуска проекта необходимо выполнить команды

```
npm install
npm run start
```

или

```
yarn
yarn start
```

## Сборка

```
npm run build
```

или

```
yarn build
```

## Данные и типы данных, используемые в приложении

Карточка товара

```
export interface IProductItem {
	id: string;
	title: string;
	description: string;
	category: string;
	image: string;
	price: number;
}
```

Данные покупателя для оформления заказа

```
export interface IOrderForm {
	payment: string;
	email?: string;
	phone?: string;
	address: string;
}
```

Тип данных, полностью описывающий данные заказа

```
export interface IOrder extends IOrderForm {
	items: string[];
	total: number;
}
```

Данные о созданном заказе

```
export interface IOrderResult {
	id: string;
	total: number;
}
```

Состояние приложения

```
export interface IAppState {
	catalog: IProductItem[];
	preview: string | null;
	order: IOrder | null;
}
```

Ошибки в форме

```
export type FormErrors = Partial<Record<keyof IOrder, string>>;
```

## Архитектура приложения

Код приложения разделен на слои согласно парадигме MVP:

- слой представления, отвечает за отображение данных на странице,
- слой данных, отвечает за хранение и изменение данных
- презентер, отвечает за связь представления и данных.

### Базовый код

#### Класс Api

Содержит в себе базовую логику отправки запросов. В конструктор передается базовый адрес сервера и опциональный объект с заголовками запросов.
Методы:

- `get` - выполняет GET запрос на переданный в параметрах ендпоинт и возвращает промис с объектом, которым ответил сервер
- `post` - принимает объект с данными, которые будут переданы в JSON в теле запроса, и отправляет эти данные на ендпоинт, переданный как параметр при вызове метода. По умолчанию выполняется `POST` запрос, но метод запроса может быть переопределен заданием третьего параметра при вызове.

#### Класс EventEmitter

Брокер событий позволяет отправлять события и подписываться на события, происходящие в системе. Класс используется в презентере для обработки событий и в слоях приложения для генерации событий.  
Основные методы, реализуемые классом описаны интерфейсом `IEvents`:

- `on` - подписка на событие
- `emit` - инициализация события
- `trigger` - возвращает функцию, при вызове которой инициализируется требуемое в параметрах событие

#### Абстрактный класс Model

Базовая модель, чтобы можно было отличить ее от простых объектов с данными. В конструктор передается объект для начальной инициализации модели, а также объект брокера событий. \
Основной метод класса `emitChanges` позволяет сгенерировать кастомное событие и опционально добавить к событию какой-либо объект с необходимыми данными.

#### Абстрактный класс Component

Базовый класс для всех элементов представления, используемых в приложении. \
В конструктор передается DOM-элемент, который будет контейнером для потомков данного класса. \
Методы базового класса `Component` позволяют управлять состоянием DOM-элементов потомков. \
Основной метод класса `Render` возвращает элемент разметки, содержащий сгенерированный контент, для отображения на странице.

### Слой данных

#### Класс AppState

```
export class AppState extends Model<IAppState>
```

Класс `AppState` хранит данные о каталоге товаров и заказе пользователя, а также логику работы с этими данными. \
Поля класса:

```
catalog: IProductItem[]; - массив объектов карточек товаров
preview: string | null; - id товара, выбранного для просмотра
order: IOrder = { - объект для хранения информации о заказе пользователя
	items: [],
	email: '',
	phone: '',
	address: '',
	payment: '',
	total: 0,
};
formErrors: FormErrors = {}; - объект ошибок формы оформления заказа
events: IEvents - экземпляр класса `EventEmitter` для инициации событий при изменении данных
```

Класс предоставляет следующие методы для работы с данными:

- `setCatalog(items: IProductItem[]): void` - заполняет поле catalog объектами карточек товаров и вызывает событие изменения массива товаров `items:changed`;
- `setPreview(item: IProductItem): void` - заполняет поле preview идентификатором выбранного товара и вызывает событие изменения выбранной карточки `preview:changed`;
- `addItemToBasket(item: IProductItem): void` - добавляет идентификатор товара в массив items объекта order и вызывает событие изменения корзины `basket:changed`;
- `deleteItemFromBasket(item: IProductItem): void` - удаляет идентификатор товара из массива items объекта order и вызывает событие изменения корзины `basket:changed`;
- `clearBasket(): void` - очищает объект order;
- `isItemInBasket(item: IProductItem): boolean` - проверят наличие товара в корзине;
- `isItemAvailable(item: IProductItem): boolean` - проверяет доступность товара для добавления в корзину;
- `getOrderItems(): IProductItem[]` - возвращает массив товаров, добавленных в корзину;
- `getTotal(): number` - вычисляет общую стоимость товаров, добавленных в корзину;
- `setOrderField(field: keyof IOrderForm, value: string): void` - заполняет поля field объекта order данными value, введенными пользователем, а также запускает проверку `validateOrder()` введенных данныых. В случае успешной проверки вызывает событие готовности заказа к отправке на сервер `order:ready`;
- `validateOrder(): boolean` - метод проверки данных, введенных пользователем. При изменении полей объекта formErrors вызывает событие `formErrors:change`;

### Слой представления

Все классы представления отвечают за отображение внутри контейнера (DOM-элемент) передаваемых в них данных.

#### Класс Basket

```
interface IBasketView {
	items: HTMLElement[];
	total: number;
}

export class Basket extends Component<IBasketView>
constructor(container: HTMLElement, protected events: EventEmitter)
```

Класс `Basket` реализует отображение корзины товаров. Конструктор класса принимает контейнер, внутри которого будут отображаться данные, и экземпляр класса `EventEmitter` для возможности инициации событий. \

Поля класса:

- `_list: HTMLElement` - элемент списка товаров;
- `_total: HTMLElement` - элемент для оторбражения суммы заказа;
- `_button: HTMLElement` - кнопка перехода к оформлению заказа;

Методы класса:

- `set items(items: HTMLElement[])` - сеттер для заполнения списка товаров в корзине;
- `set total(total: number)` - сеттер для заполнения суммы заказа.

#### Класс Form

```
interface IFormState {
	valid: boolean;
	errors: string[];
}

export class Form<T> extends Component<IFormState>
constructor(protected container: HTMLFormElement, protected events: IEvents)
```

Класс `Form` предоставляет базовый функционал работы с формами в приложении. Конструктор класса принимает элемент формы и экземпляр класса `EventEmitter` для возможности инициации событий.

Поля класса:

- `_submit: HTMLButtonElement` - кнопка отправки формы;
- `_errors: HTMLElement` - элемент для отображения ошибок валидации формы;

Методы класса:

- `protected onInputChange(field: keyof T, value: string): void` - вызывается при изменении данных в полях ввода формы и инициирует события вида `formName.fieldName:change`;
- `set valid(value: boolean)` - сеттер для установки состояния кнопки отправки формы;
- `set errors(value: string)` - сеттер для установки содержимого элемента ошибок формы;
- `render(state: Partial<T> & IFormState): HTMLFormElement` - возвращает элемент формы для отображения на странице.

#### Класс Modal

```
interface IModalData {
	content: HTMLElement;
}

export class Modal extends Component<IModalData>
constructor(container: HTMLElement, protected events: IEvents)
```

Класс `Modal` реализует модальные окна в приложении. Конструктор класса принимает контейнер, внутри которого будут отображаться данные, и экземпляр класса `EventEmitter` для возможности инициации событий.

Поля класса:

- `_closeButton: HTMLButtonElement` - кнопка закрытия модального окна;
- `_content: HTMLElement` - содержимое модального окна;

Методы класса:

- `set content(value: HTMLElement)` - сеттер для установки содержимого модального окна;
- `open(): void, close(): void` - методы открытия и закрытия модального окна соответственно;
- `render(data: IModalData): HTMLElement` - метод для отображения модального окна на странице.

#### Класс Success

```
interface ISuccess {
	total: number;
}

interface ISuccessActions {
	onClick: () => void;
}

export class Success extends Component<ISuccess>
constructor(container: HTMLElement, actions: ISuccessActions)
```

Класс `Success` реализует окно успешного заказа. Конструктор класса принимает контейнер, внутри которого будут отображаться данные, и объект, содержащий коллбэк для обработки события клика по кнопке.

Поля класса:

- `_close: HTMLElement` - кнопка "Продолжить покупки";
- `_total: HTMLElement` - элемент отображения суммы оформленного заказа;

Метод класса: `set total(value: number)` - сеттер для установки значения суммы оформленного заказа.

#### Класс Card

```
interface ICardActions {
	onClick: (event: MouseEvent) => void;
}

export interface ICard {
	title: string;
	category?: string;
	price: number;
	image?: string;
	description?: string;
	index?: string;
}

export class Card extends Component<ICard>
constructor(
		protected blockName: string,
		container: HTMLElement,
		actions?: ICardActions
	)
```

Класс `Card` реализует отображение карточек товаров в каталоге на главной странице. Конструктор класса принимает название блока (согласно БЭМ), в котором будет осуществляться поиск элементов разметки, контейнер, внутри которого будут отображаться данные, и объект, содержащий коллбэк для обработки события клика по карточке товара.

Поля класса:

- `_title: HTMLElement` - элемент разметки для отображения названия товара;
- `_image?: HTMLImageElement` - картинка товара;
- `_price: HTMLElement` - цена товара;
- `_caregory?: HTMLElement` - категория товара.

Также класс предоставляет сеттеры и геттеры для установки и чтения значений, сохраненных в полях класса.

#### Класс CardPreview

```
export class CardPreview extends Card
constructor(container: HTMLElement, actions?: ICardActions)
```

Класс `CardPreview` расширяет класс `Card` и предназначен для отображения карточки выбранного товара. Конструктор класса принимает контейнер, внутри которого будут отображаться данные, и объект, содержащий коллбэк для обработки события клика по кнопке добавления товара в корзину.

Поля класса:

- `_button: HTMLButtonElement` - кнопка добавления товара в корзину;
- `_description: HTMLElement` - элемент разметки для оторбражения описания выбранного товара.

Методы класса позволяют управлять состоянием кнопки добавления товара в корзину, а также устанавливать значения элемента разметки для описания товара.

#### Класс CardCompact

```
export class CardCompact extends Component<ICard>
constructor(container: HTMLElement, actions?: ICardActions)
```

Класс `CardCompact` реализует отображение карточек товаров внутри корзины.Конструктор класса принимает контейнер, внутри которого будут отображаться данные, и объект, содержащий коллбэк для обработки события клика по кнопке удаления товара из корзины.

Поля класса:

- `_title: HTMLElement` - элемент разметки для отображения названия товара;
- `_price: HTMLElement` - цена товара;
- `_button: HTMLButtonElement` - кнопка удаления товара из корзины;
- `_index: HTMLElement` - порядковый номер товара в корзине.

Также класс предоставляет сеттеры и геттеры для установки и чтения значений, сохраненных в полях класса.

#### Класс Order

```
interface IOrderActions {
	onClick: (event: MouseEvent) => void;
}

export class Order extends Form<IOrderForm>
constructor(
		container: HTMLFormElement,
		events: IEvents,
		actions?: IOrderActions
	)
```

Класс `Order` реализует отображение формы с выбором способа оплаты заказа и адреса доставки. Конструктор класса принимает контейнер (элемент формы), внутри которого будут отображаться данные, экземпляр класса `EventEmmiter` для возможности инициации событий и объект, содержащий коллбэк для обработки события клика по кнопкам выбора способа оплаты.

Поля класса:

- `_cardPaymentButton: HTMLButtonElement;` - кнопка выбора оплаты онлайн;
- `_cashPaymentButton` - кнопка выбора оплаты наличными.

Также класс предоставляет сеттеры для установки значений в полях формы.

#### Класс Contacts

```
export class Contacts extends Form<IOrderForm>
constructor(container: HTMLFormElement, events: IEvents)
```

Класс `Contacts` реализует отображение формы для заполнения контактных данных пользователя. Конструктор класса принимает контейнер (элемент формы), внутри которого будут отображаться данные, и экземпляр класса `EventEmmiter` для возможности инициации событий.\
Класс предоставляет сеттеры для установки значений в полях формы.

#### Класс Page

```
interface IPage {
	counter: number;
	catalog: HTMLElement[];
	locked: boolean;
}

export class Page extends Component<IPage>
constructor(container: HTMLElement, protected events: IEvents)
```

Класс `Page` реализует отображение главной страницы приложения. Конструктор класса принимает контейнер (элемент формы), внутри которого будут отображаться данные, и экземпляр класса `EventEmmiter` для возможности инициации событий.

Поля класса:

- `_counter: HTMLElement` - элемент для отображения количества товаров в корзине;
- `_catalog: HTMLElement` - каталог товаров;
- `_wrapper: HTMLElement` - элемент-обертка основного контента страницы;
- `_basket: HTMLElement` - элемент корзины на странице.

Методы класса позволяют устанавливать значения в полях, а также блокировать прокрутку страницы при открытии модальных окон.

### Слой коммуникации

#### Класс ShopApi

```
export interface IShopApi {
	getProductItemList: () => Promise<IProductItem[]>;
	getProductItem: (id: string) => Promise<IProductItem>;
	orderItem: (order: IOrder) => Promise<IOrderResult>;
}

export class ShopApi extends Api implements IShopApi
```

Принимает в конструктор экземпляр класса Api и предоставляет методы реализующие взаимодействие с бэкендом сервиса.

Методы класса:

- `getProductItemList(): Promise<IProductItem[]>` - получает каталог товаров;
- `getProductItem(id: string): Promise<IProductItem>` - получает информацию о товаре по переданному идентификатору;
- `orderItem(order: IOrder): Promise<IOrderResult>` - отправка информации об оформленном заказе на сервер.

## Взаимодействие компонентов

Код, описывающий взаимодействие представления и данных между собой находится в файле `index.ts`, выполняющем роль презентера.\
Взаимодействие осуществляется за счет событий, генерируемых с помощью брокера событий, и обработчиков этих событий, описанных в `index.ts`\
В `index.ts` сначала создаются экземпляры всех необходимых классов, а затем настраивается обработка событий.

_Список всех событий, которые могут генерироваться в системе:_\

_События изменения данных (генерируются моделью данных)_

- `items:changed` - изменение каталога товаров;
- `preview:changed` - изменение карточки выбранного товара;
- `basket:changed` - изменение состояния корзины (добавили или удалили товар);
- `order:ready` - данные по заказу прошли валидацию и готовы к отправке на сервер;
- `formErrors:change` - изменение состояния объекта, хранящего ошибки валидации формы.

_События, возникающие при взаимодействии пользователя с интерфейсом (генерируются классами, отвечающими за представление)_

- `card:select` - клик по карточке товара в каталоге;
- `modal:open` - открытие модального окна;
- `modal:close` - закрытие модального окна;
- `basket:open` - открытие корзины;
- `order:open` - открытие формы выбора способа оплаты и адреса доставки;
- `order:submit` - отправка формы выбора способа оплаты и адреса доставки;
- `contacts:submit` - оформление заказа;
- `/^(order\.._|contacts\.._):change/` - изменение полей ввода форм Order или Contacts.
