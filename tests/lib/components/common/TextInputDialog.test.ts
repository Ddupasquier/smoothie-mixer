import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";
import TextInputDialog from "$lib/components/common/TextInputDialog.svelte";

describe("TextInputDialog", () => {
	it("does not render when closed", () => {
		render(TextInputDialog, {
			props: {
				open: false,
				title: "Save Drink",
				label: "Drink name",
				onConfirm: vi.fn(),
				onCancel: vi.fn(),
			},
		});

		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});

	it("confirms typed text and supports cancel", async () => {
		const onConfirm = vi.fn();
		const onCancel = vi.fn();

		render(TextInputDialog, {
			props: {
				open: true,
				title: "Save Drink",
				description: "Name this mix.",
				label: "Drink name",
				confirmLabel: "Save",
				initialValue: "Draft",
				onConfirm,
				onCancel,
			},
		});

		const input = screen.getByLabelText(/drink name/i);
		expect(input).toHaveValue("Draft");

		await fireEvent.input(input, { target: { value: "Post-workout" } });
		await fireEvent.click(screen.getByRole("button", { name: "Save" }));
		await fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

		expect(onConfirm).toHaveBeenCalledWith("Post-workout");
		expect(onCancel).toHaveBeenCalledOnce();
	});
});
