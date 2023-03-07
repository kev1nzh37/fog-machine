import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Breadcrumb, Container, Content, Divider } from "rsuite";

const RenderContent = () => <div>adsda</div>;

const Contrast = () => {
  console.log(1);
  const navigate = useNavigate();
  const { t } = useTranslation();
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
            <Breadcrumb.Item active>
              {t("home-contrast-title")}
            </Breadcrumb.Item>
          </Breadcrumb>

          <Divider style={{ marginTop: "1vh" }} />

          <RenderContent />
        </div>
      </Content>
    </Container>
  );
};
export default Contrast;
