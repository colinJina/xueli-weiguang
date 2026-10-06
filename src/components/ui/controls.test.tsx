// @vitest-environment jsdom
import "../../../tests/dom-setup";
import { createRef, useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FilterButton } from "@/components/ui/filter-button";
import { RangeField } from "@/components/ui/range-field";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { FormMessage } from "@/components/ui/form-message";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

describe("shared controls", () => {
  it("composes a single link and forwards button refs and clicks", async () => {
    const ref = createRef<HTMLButtonElement>();
    const clicked = vi.fn();
    render(
      <>
        <Button asChild onClick={clicked}>
          <a href="#destination">前往</a>
        </Button>
        <Button ref={ref}>保存</Button>
      </>,
    );
    const link = screen.getByRole("link", { name: "前往" });
    await userEvent.click(link);
    expect(clicked).toHaveBeenCalledOnce();
    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(ref.current).toBe(screen.getByRole("button", { name: "保存" }));
  });

  it("keeps disabled actions inert", async () => {
    const clicked = vi.fn();
    render(
      <Button disabled onClick={clicked}>
        保存
      </Button>,
    );
    await userEvent.click(screen.getByRole("button"));
    expect(clicked).not.toHaveBeenCalled();
  });

  it("labels inputs, preserves native attributes and forwards the input ref", async () => {
    const ref = createRef<HTMLInputElement>();
    render(
      <TextField
        label="邮箱"
        type="email"
        maxLength={64}
        autoComplete="email"
        ref={ref}
      />,
    );
    const input = screen.getByRole("textbox", { name: "邮箱" });
    await userEvent.type(input, "a@example.test");
    expect(input).toHaveValue("a@example.test");
    expect(input).toHaveAttribute("autocomplete", "email");
    expect(ref.current).toBe(input);
  });

  it("preserves textarea input and disabled states", async () => {
    const view = render(
      <Label>
        备注
        <Textarea maxLength={5} />
      </Label>,
    );
    await userEvent.type(screen.getByRole("textbox"), "abcdef");
    expect(screen.getByRole("textbox")).toHaveValue("abcde");
    view.rerender(
      <Label>
        备注
        <Textarea disabled />
      </Label>,
    );
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("checks a checkbox through its label and with Space", async () => {
    function Fixture() {
      const [checked, setChecked] = useState(false);
      return (
        <Label htmlFor="choose">
          收藏夹
          <Checkbox
            id="choose"
            checked={checked}
            onCheckedChange={(next) => setChecked(next === true)}
          />
        </Label>
      );
    }
    render(<Fixture />);
    await userEvent.click(screen.getByText("收藏夹"));
    expect(screen.getByRole("checkbox")).toBeChecked();
    await userEvent.keyboard(" ");
    expect(screen.getByRole("checkbox")).not.toBeChecked();
  });

  it("does not change a disabled checkbox", async () => {
    const changed = vi.fn();
    render(<Checkbox aria-label="收藏夹" disabled onCheckedChange={changed} />);
    await userEvent.click(screen.getByRole("checkbox"));
    expect(changed).not.toHaveBeenCalled();
  });

  it("preserves controlled filter toggles", async () => {
    function Fixture() {
      const [active, setActive] = useState(false);
      return (
        <FilterButton active={active} onClick={() => setActive(!active)}>
          精选
        </FilterButton>
      );
    }
    render(<Fixture />);
    const filter = screen.getByRole("button", { name: "精选" });
    await userEvent.click(filter);
    expect(filter).toHaveAttribute("aria-pressed", "true");
    await userEvent.keyboard(" ");
    expect(filter).toHaveAttribute("aria-pressed", "false");
  });

  it("moves tabs with arrows, skips disabled tabs and associates their panel", async () => {
    render(
      <Tabs defaultValue="a">
        <TabsList aria-label="模式">
          <TabsTrigger value="a">链接</TabsTrigger>
          <TabsTrigger value="b" disabled>
            禁用
          </TabsTrigger>
          <TabsTrigger value="c">图片</TabsTrigger>
        </TabsList>
        <TabsContent value="a">链接内容</TabsContent>
        <TabsContent value="c">图片内容</TabsContent>
      </Tabs>,
    );
    screen.getByRole("tab", { name: "链接" }).focus();
    await userEvent.keyboard("{ArrowRight}");
    const image = screen.getByRole("tab", { name: "图片" });
    await waitFor(() => expect(image).toHaveAttribute("aria-selected", "true"));
    expect(image).toHaveFocus();
    expect(screen.getByRole("tabpanel")).toHaveAccessibleName("图片");
    await userEvent.keyboard("{Home}");
    await waitFor(() =>
      expect(screen.getByRole("tabpanel")).toHaveTextContent("链接内容"),
    );
  });

  it("selects an option by keyboard and restores trigger focus", async () => {
    const changed = vi.fn();
    render(
      <>
        <Label htmlFor="folder">所属收藏夹</Label>
        <Select defaultValue="a" onValueChange={changed}>
          <SelectTrigger id="folder">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">一号</SelectItem>
            <SelectItem value="b">二号</SelectItem>
          </SelectContent>
        </Select>
      </>,
    );
    const trigger = screen.getByRole("combobox", { name: "所属收藏夹" });
    trigger.focus();
    await userEvent.keyboard("{Enter}");
    await screen.findByRole("option", { name: "一号" });
    await userEvent.keyboard("{ArrowDown}{Enter}");
    expect(changed).toHaveBeenCalledWith("b");
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(trigger).toHaveTextContent("二号");
  });

  it("commits slider keyboard changes with numeric values and respects limits", async () => {
    const committed = vi.fn();
    function Fixture() {
      const [value, setValue] = useState(50);
      return (
        <RangeField
          label="精度"
          min={1}
          max={100}
          value={value}
          valueLabel={`${value} / 100`}
          onValueChange={setValue}
          onValueCommit={committed}
        />
      );
    }
    render(<Fixture />);
    const slider = screen.getByRole("slider", { name: "精度" });
    slider.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(slider).toHaveAttribute("aria-valuenow", "51");
    expect(committed).toHaveBeenLastCalledWith(51);
    await userEvent.keyboard("{End}{ArrowRight}");
    expect(slider).toHaveAttribute("aria-valuenow", "100");
    await userEvent.keyboard("{Home}{ArrowLeft}");
    expect(slider).toHaveAttribute("aria-valuenow", "1");
  });

  it("exposes clamped progress to assistive technology", () => {
    const view = render(<Progress aria-label="上传进度" value={125} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "100",
    );
    view.rerender(<Progress aria-label="上传进度" value={-4} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "0",
    );
    view.rerender(<Progress aria-label="上传进度" value={null} />);
    expect(screen.getByRole("progressbar")).not.toHaveAttribute(
      "aria-valuenow",
    );
  });

  it("announces errors urgently and other messages politely", () => {
    render(
      <>
        <FormMessage icon={<svg aria-hidden="true" />} variant="error">
          保存失败
        </FormMessage>
        <FormMessage icon={<svg aria-hidden="true" />} variant="success">
          已保存
        </FormMessage>
      </>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("保存失败");
    expect(screen.getByRole("status")).toHaveTextContent("已保存");
  });

  it("keeps the avatar fallback when the image fails", () => {
    render(
      <Avatar>
        <AvatarImage src="https://invalid.test/avatar.png" alt="头像" />
        <AvatarFallback>雪</AvatarFallback>
      </Avatar>,
    );
    expect(screen.getByText("雪")).toBeVisible();
  });

  it("hides decorative skeletons from assistive technology", () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });

  it("forwards native file selection", () => {
    const changed = vi.fn();
    const file = new File(["image"], "cover.png", { type: "image/png" });
    render(
      <TextField
        label="封面文件"
        type="file"
        accept="image/png"
        onChange={changed}
      />,
    );
    fireEvent.change(screen.getByLabelText("封面文件"), {
      target: { files: [file] },
    });
    expect(changed).toHaveBeenCalledOnce();
  });
});
