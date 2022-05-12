import { App, Modal, moment } from "obsidian";
import SelectDatesModal from "./SelectDatesModal.svelte";

type DateRange = {
	startDate: moment.Moment | undefined;
	endDate: moment.Moment | undefined;
};

export class SelectDatesModalView extends Modal {
	private startDate: moment.Moment;
	private endDate: moment.Moment;
	private selectDatesModal: SelectDatesModal;
	private resolve: (dateRange: DateRange) => void;
	private reject: (error: Error) => void;

	private promise = new Promise<DateRange>((resolve, reject) => {
		this.resolve = resolve;
		this.reject = reject;
	});

	constructor(app: App, startDate?: moment.Moment, endDate?: moment.Moment) {
		super(app);
		this.startDate = startDate || moment();
		this.endDate = endDate || moment();
	}

	onOpen(): void {
		this.selectDatesModal = new SelectDatesModal({
			target: this.contentEl,
			props: {
				startDate: this.startDate,
				endDate: this.endDate,
			},
		});

		this.selectDatesModal.$on("close", (event: CustomEvent<DateRange>) => {
			this.startDate = event.detail.startDate;
			this.endDate = event.detail.endDate;
			this.close();
		});
	}

	wait(): Promise<DateRange> {
		return this.promise;
	}

	onClose() {
		this.selectDatesModal.$destroy();
		this.selectDatesModal = null;
		this.resolve({ startDate: this.startDate, endDate: this.endDate });
	}
}
