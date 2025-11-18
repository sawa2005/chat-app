import { render, screen } from "@testing-library/react";
import { Button } from "./button";

describe("Button", () => {
    it("renders a button with the correct text", () => {
        render(<Button>Click me</Button>);
        expect(screen.getByRole("button", { name: /click me/i })).toBeInTheDocument();
    });

    it("renders a button with a custom variant", () => {
        render(<Button variant="destructive">Delete</Button>);
        const button = screen.getByRole("button", { name: /delete/i });
        expect(button).toBeInTheDocument();
        expect(button).toHaveClass("bg-destructive"); // Assuming destructive variant adds this class
    });

    it("renders a button with a custom size", () => {
        render(<Button size="lg">Large Button</Button>);
        const button = screen.getByRole("button", { name: /large button/i });
        expect(button).toBeInTheDocument();
        expect(button).toHaveClass("h-10"); // Assuming lg size adds this class
    });

    it("renders a disabled button", () => {
        render(<Button disabled>Disabled Button</Button>);
        const button = screen.getByRole("button", { name: /disabled button/i });
        expect(button).toBeInTheDocument();
        expect(button).toBeDisabled();
    });
});
