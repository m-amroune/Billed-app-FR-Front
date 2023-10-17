/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import BillsUI from "../views/BillsUI.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";
import router from "../app/Router.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then, mail icon in vertical layout should be highlighted", async () => {
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
      window.onNavigate(ROUTES_PATH.NewBill);
      await waitFor(() => screen.getByTestId("icon-mail"));
      const mailIcon = screen.getByTestId("icon-mail");

      expect(mailIcon.classList.contains("active-icon")).toBe(true);
    });
  });
  describe("When I am on NewBill Page and I select a file", () => {
    test("Then, the file is uploaded", () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({ type: "Employee", email: "a@a" })
      );
      const html = NewBillUI();
      document.body.innerHTML = html;
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      const newBillPage = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage,
      });

      const handleChangeFile = jest.fn((e) => newBillPage.handleChangeFile(e));
      const file = new File(["file.png"], "file.png", {
        type: "image/png",
      });
      const inputFile = screen.getByTestId("file");
      inputFile.addEventListener("change", handleChangeFile);
      fireEvent.change(inputFile, {
        target: { files: [file] },
      });
      expect(handleChangeFile).toHaveBeenCalled();
      expect(inputFile.files[0].name).toBe("file.png");
    });
  });
  describe("When the file extension is not png, jpeg or jpg", () => {
    test("Then, it should not be uploaded", () => {
      document.body.innerHTML = NewBillUI();

      const newBill = new NewBill({
        document,
        onNavigate,
        firestore: null,
        localStorage: window.localStorage,
      });

      const handleChangeFile = jest.fn(newBill.handleChangeFile);

      const inputFile = screen.getByTestId("file");
      inputFile.addEventListener("change", handleChangeFile);

      const errorFile = new File(["test.psb"], "test.psb", {
        type: "document/psb",
      });
      fireEvent.change(inputFile, {
        target: { files: [errorFile] },
      });

      const errorMessage = screen.getByTestId("file-error-message");

      expect(handleChangeFile).toHaveBeenCalled();
      expect(inputFile.value).not.toBe("test.psb");
      expect(errorMessage.textContent).toEqual(
        expect.stringContaining("image extension must be png, jpeg or jpg")
      );
      expect(errorMessage.classList.contains("visible")).toBeTruthy();
    });
  });
});

// Test integration POST
describe("Given I am connected as an employee", () => {
  describe("When I submit a new Bill", () => {
    test("Then, it should create a new bill and redirect to Bills page ", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      localStorage.setItem(
        "user",
        JSON.stringify({ type: "Employee", email: "a@a" })
      );
      const html = NewBillUI();
      document.body.innerHTML = html;
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      const newBillPage = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage,
      });
      const validationBill = {
        name: "test3",
        type: "Services en ligne",
        vat: "60",
        pct: 20,
        amount: 300,
        status: "accepted",
        date: "2003-03-03",
        commentary: "",
        fileName:
          "facture-client-php-exportee-dans-document-pdf-enregistre-sur-disque-dur.png",
        fileUrl:
          "https://test.storage.tld/v0/b/billable-677b6.a…dur.png?alt=media&token=571d34cb-9c8f-430a-af52-66221cae1da3",
      };
      screen.getByTestId("expense-name").value = validationBill.name;
      screen.getByTestId("expense-type").value = validationBill.type;
      screen.getByTestId("vat").value = validationBill.vat;
      screen.getByTestId("pct").value = validationBill.pct;
      screen.getByTestId("amount").value = validationBill.amount;
      screen.getByTestId("datepicker").value = validationBill.date;
      screen.getByTestId("commentary").value = validationBill.commentary;
      newBillPage.fileName = validationBill.fileName;
      newBillPage.fileUrl = validationBill.fileUrl;

      newBillPage.updateBill = jest.fn();
      const handleSubmit = jest.fn((e) => newBillPage.handleSubmit(e));

      const form = screen.getByTestId("form-new-bill");
      form.addEventListener("submit", handleSubmit);
      fireEvent.submit(form);
      expect(handleSubmit).toHaveBeenCalled();
      expect(newBillPage.updateBill).toHaveBeenCalled();
    });

    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills");
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
            email: "a@a",
          })
        );
        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.appendChild(root);
        router();
      });
      test("it should create a new bill but fails with 404 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            create: () => {
              return Promise.reject(new Error("Erreur 404"));
            },
          };
        });
        document.body.innerHTML = BillsUI({ error: "Erreur 404" });
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 404/);
        expect(message).toBeTruthy();
      });
      test("Then, it should create a new bill but fails with 500 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            create: () => {
              return Promise.reject(new Error("Erreur 500"));
            },
          };
        });
        document.body.innerHTML = BillsUI({ error: "Erreur 500" });
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 500/);
        expect(message).toBeTruthy();
      });
    });
  });
});
