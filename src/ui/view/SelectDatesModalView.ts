import { App, Modal, moment } from "obsidian";
import SelectDatesModal from "./SelectDatesModal.svelte";

type DateRange = {
	startDate: moment.Moment;
	endDate: moment.Moment;
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
		this.selectDatesModal.$on("value", (v: CustomEvent) => {
			this.startDate = v.detail.startDate;
			this.endDate = v.detail.endDate;
		});

		this.selectDatesModal.$on("close", () => {
			this.close();
		});
	}

	wait(): Promise<DateRange> {
    return this.promise;
  }

	onClose() {
		this.selectDatesModal.$destroy();
		this.selectDatesModal = null;

    if (this.startDate && this.endDate) {
      this.resolve({startDate: this.startDate, endDate: this.endDate});
    } else {
      this.reject(new Error("No date range selected"));
    }
	}
}
