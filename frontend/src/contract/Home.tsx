import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  Breadcrumb,
  Container,
  Content,
  Divider,
  IconButton,
  Panel,
  SelectPicker,
} from "rsuite";
import ConversionIcon from "@rsuite/icons/Conversion";
import PlusIcon from "@rsuite/icons/Plus";
import emptyIcon from "./empty.png";

import "./Home.css";

const data = [
  "Eugenia",
  "Bryan",
  "Linda",
  "Nancy",
  "Lloyd",
  "Alice",
  "Julia",
  "Albert",
].map((item) => ({ label: item, value: item }));

const Contrast = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const FileBox = () => (
    <Panel shaded bordered bodyFill>
      <div className="file-box">
        <div className="file-box__empty">
          <img src={emptyIcon} alt="" />
          <span>No More Snapshots</span>
        </div>
        <Divider />
        <div className="file-box-buttons">
          <IconButton
            icon={<PlusIcon />}
            onClick={() => {
              console.log("upload");
            }}
          >
            {t("snapshot-list-upload")}
          </IconButton>
          <span>Or</span>
          <SelectPicker data={data} style={{ width: 224 }} />
        </div>
      </div>
    </Panel>
  );
  const RenderContent = () => (
    <div className="contrast">
      <FileBox />
      <div className="contrast__icon">
        <ConversionIcon />
      </div>
      <FileBox />
    </div>
  );

  return (
    <Container>
      <Content>
        <div className="time-machine-body">
          <Breadcrumb
            style={{ marginTop: "5vh", marginBottom: "0", fontSize: "19px" }}
          >
            <Breadcrumb.Item
              onClick={() => {
                navigate("/", { replace: false });
              }}
              href="/"
            >
              {t("home-main-title")}
            </Breadcrumb.Item>
            <Breadcrumb.Item active>{t("home-contrast-title")}</Breadcrumb.Item>
          </Breadcrumb>

          <Divider style={{ marginTop: "1vh" }} />

          <RenderContent />
        </div>
      </Content>
    </Container>
  );
};
export default Contrast;
