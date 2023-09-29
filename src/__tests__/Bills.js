/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import BillsUI from "../views/BillsUI.js";
import Bills from "../containers/Bills";

import { bills } from "../fixtures/bills.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import router from "../app/Router.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      // add expect expression
      expect(windowIcon.classList.contains("active-icon")).toBe(true);
    });
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });
  });
});

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page and I click on New Bill button", () => {
    test("Then, form page should be displayed", () => {
      const html = BillsUI({ data: [] });
      document.body.innerHTML = html;
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const bill = new Bills({
        document,
        onNavigate,
        firestore: null,
        localStorage: window.localStorage,
      });
      const button = document.querySelector("[data-testid=btn-new-bill]");
      const buttonNewBill = jest.fn((e) => bill.handleClickNewBill(e));
      button.addEventListener("click", buttonNewBill);
      userEvent.click(button);
      expect(buttonNewBill).toHaveBeenCalled();
    });
  });
  describe("When I click on icon eye", () => {
    test("then, modal should be displayed", () => {
      const html = BillsUI({ data: bills });
      document.body.innerHTML = html;
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const myBills = new Bills({
        document,
        onNavigate,
        firestore: null,
        localStorage: window.localStorage,
      });

      $.fn.modal = jest.fn();

      const iconEye = screen.getAllByTestId("icon-eye")[0];
      const handleClickIconEye = jest.fn((e) => {
        e.preventDefault();
        myBills.handleClickIconEye(iconEye);
      });
      iconEye.addEventListener("click", handleClickIconEye);
      userEvent.click(iconEye);
      expect(handleClickIconEye).toHaveBeenCalled();
    });
  });
});
