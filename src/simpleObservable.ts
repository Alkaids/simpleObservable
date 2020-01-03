// ref: https://zhuanlan.zhihu.com/p/27776484

interface Observer {
	next: (...args: any[]) => void;
	error: (...args: any[]) => void;
	complete: (...args: any[]) => void;
}
interface TypeSafeObserver {
	next: (...args: any[]) => void;
	error: (...args: any[]) => void;
	complete: (...args: any[]) => void;
	unSubscribe: () => void;
}

interface TypeObservable {
	subscribe: (observer: Observer) => () => void;
}

type SubscribeFn = (observer: TypeSafeObserver) => () => void;

class SafeObserver implements TypeSafeObserver {
	private isUnSubscribed: boolean = false;
	constructor(private observer: Partial<Observer>) {}
	next(...args: any[]) {
		const observer = this.observer;
		if (!this.isUnSubscribed) {
			observer.next && observer.next(...args);
		}
	}
	error(...args: any[]) {
		const observer = this.observer;
		if (!this.isUnSubscribed) {
			observer.error && observer.error(...args);
			this.unSubscribe();
		}
	}
	complete(...args: any[]) {
		const observer = this.observer;
		if (!this.isUnSubscribed) {
			observer.complete && observer.complete(...args);
			this.unSubscribe();
		}
	}
	unSubscribe() {
		if (!this.isUnSubscribed) {
			this.isUnSubscribed = true;
			typeof this._unsubscribe === 'function' && this._unsubscribe();
		}
	}
	_unsubscribe() {}
}
class Observable implements TypeObservable {
	constructor(private subscribeFn: SubscribeFn) {}
	subscribe(observer: Observer) {
		const safeObserver = new SafeObserver(observer);
		safeObserver._unsubscribe = this.subscribeFn(safeObserver);
		return () => safeObserver.unSubscribe();
	}
}

const observer: Observer = {
	next: (...args) => {
		console.log('next:', ...args);
	},
	error: (...args) => {
		console.log('error:', ...args);
	},
	complete: (...args) => {
		console.log('complete:', ...args);
	}
};

const observable = new Observable(observer => {
	let i = 0;
	const id = setInterval(() => {
		if (i < 10) {
			i++;
			return observer.next(i);
		}
        observer.complete('完成！');
        observer.next(i);
	}, 1000);
	return () => {
		clearInterval(id);
	};
});

const unsub = observable.subscribe(observer);

setTimeout(unsub, 6000);
