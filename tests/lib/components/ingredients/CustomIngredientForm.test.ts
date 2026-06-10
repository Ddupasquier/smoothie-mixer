import { fireEvent, render, screen } from "@testing-library/svelte";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CustomIngredientForm from "$lib/components/ingredients/CustomIngredientForm.svelte";

describe("CustomIngredientForm", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it("requires an ingredient name before saving", async () => {
		render(CustomIngredientForm, {
			props: {
				onCreate: vi.fn(),
			},
		});

		await fireEvent.click(screen.getByText("Add custom ingredient"));
		await fireEvent.click(
			screen.getByRole("button", { name: /save custom ingredient/i }),
		);

		expect(screen.getByRole("alert")).toHaveTextContent(
			"Add a name for this ingredient.",
		);
	});

	it("creates a custom ingredient from label nutrition values", async () => {
		const onCreate = vi.fn();
		render(CustomIngredientForm, {
			props: {
				onCreate,
			},
		});

		await fireEvent.click(screen.getByText("Add custom ingredient"));
		await fireEvent.input(screen.getByLabelText(/ingredient name/i), {
			target: { value: "Chocolate cookies" },
		});
		await fireEvent.input(screen.getByLabelText(/serving label/i), {
			target: { value: "3 cookies" },
		});
		await fireEvent.input(screen.getByLabelText(/serving weight/i), {
			target: { value: "34" },
		});
		await fireEvent.input(screen.getByLabelText(/^calories$/i), {
			target: { value: "160" },
		});

		await fireEvent.click(
			screen.getByRole("button", { name: /save custom ingredient/i }),
		);

		expect(onCreate).toHaveBeenCalledOnce();
		expect(onCreate.mock.calls[0][0]).toMatchObject({
			description: "Chocolate cookies",
			customFood: true,
			customServingLabel: "3 cookies",
			customServingWeightGrams: 34,
		});
	});
});
