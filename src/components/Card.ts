import { Component } from './base/Component';
import { ensureElement } from '../utils/utils';

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

export class Card extends Component<ICard> {
	protected _title: HTMLElement;
	protected _image?: HTMLImageElement;
	protected _price: HTMLElement;
	protected _caregory?: HTMLElement;

	constructor(
		protected blockName: string,
		container: HTMLElement,
		actions?: ICardActions
	) {
		super(container);

		this._title = ensureElement<HTMLElement>(`.${blockName}__title`, container);
		this._image = ensureElement<HTMLImageElement>(
			`.${blockName}__image`,
			container
		);
		this._caregory = ensureElement<HTMLElement>(
			`.${blockName}__category`,
			container
		);
		this._price = ensureElement<HTMLElement>(`.${blockName}__price`, container);

		if (actions?.onClick) {
			container.addEventListener('click', actions.onClick);
		}
	}

	set id(value: string) {
		this.container.dataset.id = value;
	}

	get id(): string {
		return this.container.dataset.id || '';
	}

	set title(value: string) {
		this.setText(this._title, value);
	}

	get title(): string {
		return this._title.textContent || '';
	}

	set image(value: string) {
		this.setImage(this._image, value, this.title);
	}

	set category(value: string) {
		this.setText(this._caregory, value);
	}

	set price(value: number) {
		if (value) {
			this.setText(this._price, `${String(value)} синапсов`);
		} else {
			this.setText(this._price, 'Бесценно 🗿');
		}
	}
}

export class CardPreview extends Card {
	protected _button: HTMLButtonElement;
	protected _description: HTMLElement;

	constructor(container: HTMLElement, actions?: ICardActions) {
		super('card', container, actions);
		this._description = ensureElement<HTMLElement>('.card__text', container);
		this._button = ensureElement<HTMLButtonElement>('.card__button', container);

		if (actions?.onClick) {
			this._button.addEventListener('click', actions.onClick);
			container.removeEventListener('click', actions.onClick);
		}
	}

	blockAddButton(state: boolean) {
		this.setDisabled(this._button, state);
	}

	set description(value: string) {
		this.setText(this._description, value);
	}
}

export class CardCompact extends Component<ICard> {
	protected _title: HTMLElement;
	protected _price: HTMLElement;
	protected _button: HTMLButtonElement;
	protected _index: HTMLElement;

	constructor(container: HTMLElement, actions?: ICardActions) {
		super(container);

		this._index = ensureElement<HTMLElement>('.basket__item-index', container);
		this._title = ensureElement<HTMLElement>('.card__title', container);
		this._price = ensureElement<HTMLElement>('.card__price', container);
		this._button = ensureElement<HTMLButtonElement>('.card__button', container);

		if (actions?.onClick) {
			this._button.addEventListener('click', actions.onClick);
		}
	}

	set index(value: string) {
		this.setText(this._index, value);
	}

	set title(value: string) {
		this.setText(this._title, value);
	}

	get title(): string {
		return this._title.textContent || '';
	}

	set price(value: string) {
		this.setText(this._price, `${value} синапсов`);
	}

	get price(): string {
		return this._price.textContent || '';
	}
}
