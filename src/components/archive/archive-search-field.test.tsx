// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { ArchiveSearchField } from "@/components/archive/archive-search-field";

afterEach(() => { cleanup(); vi.useRealTimers(); });
describe("archive search editing", () => {
  it("debounces typing and immediately invalidates previous requests", () => {
    vi.useFakeTimers();
    const onSearch = vi.fn(), onEditing = vi.fn();
    const view = render(<ArchiveSearchField query="" onSearch={onSearch} onEditing={onEditing} />);
    const input = view.getByRole("searchbox");
    fireEvent.change(input, { target: { value: "雪" } });
    act(() => vi.advanceTimersByTime(100));
    fireEvent.change(input, { target: { value: "雪 PV" } });
    act(() => vi.advanceTimersByTime(149));
    expect(onSearch).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(onEditing).toHaveBeenCalledTimes(2);
    expect(onSearch).toHaveBeenLastCalledWith("雪 PV", { replace: true, immediate: true });
  });
  it("waits for composition and suppresses Enter while composing", () => {
    vi.useFakeTimers();
    const onSearch = vi.fn();
    const view = render(<ArchiveSearchField query="" onSearch={onSearch} onEditing={vi.fn()} />);
    const input = view.getByRole("searchbox");
    fireEvent.compositionStart(input);
    fireEvent.change(input, { target: { value: "雪" } });
    fireEvent.keyDown(input, { key: "Enter", isComposing: true });
    fireEvent.submit(view.getByRole("search"));
    act(() => vi.advanceTimersByTime(500));
    expect(onSearch).not.toHaveBeenCalled();
    fireEvent.compositionEnd(input);
    act(() => vi.advanceTimersByTime(150));
    expect(onSearch).toHaveBeenCalledOnce();
  });
  it("commits on Enter, clears immediately and restores keyboard focus", () => {
    vi.useFakeTimers();
    const onSearch = vi.fn();
    const view = render(<ArchiveSearchField query="pv" onSearch={onSearch} onEditing={vi.fn()} />);
    fireEvent.change(view.getByRole("searchbox"), { target: { value: "作者" } });
    fireEvent.submit(view.getByRole("search"));
    expect(onSearch).toHaveBeenLastCalledWith("作者", { replace: false, immediate: true });
    fireEvent.click(view.getByRole("button", { name: "清除搜索" }));
    expect(onSearch).toHaveBeenLastCalledWith("", { replace: false, immediate: true });
    expect(document.activeElement).toBe(view.getByRole("searchbox"));
    act(() => vi.advanceTimersByTime(500));
    expect(onSearch).toHaveBeenCalledTimes(2);
  });
  it("rejects invalid text and cancels timers on navigation and unmount", () => {
    vi.useFakeTimers();
    const onSearch = vi.fn(), onEditing = vi.fn();
    const view = render(<ArchiveSearchField query="" onSearch={onSearch} onEditing={onEditing} />);
    fireEvent.change(view.getByRole("searchbox"), { target: { value: "雪".repeat(121) } });
    act(() => vi.advanceTimersByTime(500));
    expect(onSearch).not.toHaveBeenCalled();
    expect(view.getByRole("alert").textContent).toContain("120");
    expect(onEditing).toHaveBeenLastCalledWith(false);
    fireEvent.change(view.getByRole("searchbox"), { target: { value: "pv" } });
    view.rerender(<ArchiveSearchField query="返回的搜索" onSearch={onSearch} onEditing={onEditing} />);
    act(() => vi.advanceTimersByTime(150));
    expect(onSearch).not.toHaveBeenCalled();
    fireEvent.change(view.getByRole("searchbox"), { target: { value: "新输入" } });
    view.unmount();
    act(() => vi.advanceTimersByTime(150));
    expect(onSearch).not.toHaveBeenCalled();
  });
  it("immediately submits when the keyboard deletes the last character", () => {
    vi.useFakeTimers();
    const onSearch = vi.fn();
    const view = render(<ArchiveSearchField query="pv" onSearch={onSearch} onEditing={vi.fn()} />);
    fireEvent.change(view.getByRole("searchbox"), { target: { value: "" } });
    expect(onSearch).toHaveBeenCalledExactlyOnceWith("", { replace: true, immediate: true });
    act(() => vi.advanceTimersByTime(150));
    expect(onSearch).toHaveBeenCalledOnce();
  });
});
