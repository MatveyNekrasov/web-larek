import { Form } from './common/Form';
import { IOrderForm } from '../types';
import { IEvents } from './base/events';
import { ensureElement } from '../utils/utils';

interface IOrderActions {
	onClick: (event: MouseEvent) => void;
}

export class Order extends Form<IOrderForm> {
	protected _cardPaymentButton: HTMLButtonElement;
	protected _cashPaymentButton: HTMLButtonElement;

	constructor(
		container: HTMLFormElement,
		events: IEvents,
		actions?: IOrderActions
	) {
		super(container, events);

		this._cardPaymentButton = this.container.elements.namedItem(
			'card'
		) as HTMLButtonElement;
		this._cashPaymentButton = this.container.elements.namedItem(
			'cash'
		) as HTMLButtonElement;

		if (actions?.onClick) {
			this._cardPaymentButton.addEventListener('click', (event) => {
				actions.onClick(event);
				events.emit('order.payment:change', {
					field: 'payment',
					value: 'online',
				});
			});
			this._cashPaymentButton.addEventListener('click', (event) => {
				actions.onClick(event);
				events.emit('order.payment:change', {
					field: 'payment',
					value: 'cash',
				});
			});
		}
	}

	set address(value: string) {
		(this.container.elements.namedItem('address') as HTMLInputElement).value =
			value;
	}

	set payment(value: string) {
		if (value === '') {
			this._cardPaymentButton.classList.remove('button_alt-active');
			this._cashPaymentButton.classList.remove('button_alt-active');
		}
		if (value === 'card') {
			this._cardPaymentButton.classList.add('button_alt-active');
			this._cashPaymentButton.classList.remove('button_alt-active');
		}
		if (value === 'cash') {
			this._cardPaymentButton.classList.remove('button_alt-active');
			this._cashPaymentButton.classList.add('button_alt-active');
		}
	}
}

export class Contacts extends Form<IOrderForm> {
	constructor(container: HTMLFormElement, events: IEvents) {
		super(container, events);
	}

	set phone(value: string) {
		(this.container.elements.namedItem('phone') as HTMLInputElement).value =
			value;
	}

	set email(value: string) {
		(this.container.elements.namedItem('email') as HTMLInputElement).value =
			value;
	}
}
