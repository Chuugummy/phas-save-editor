import { 
  Button,
  EditIcon,
  FilePicker, TextInput, toaster, Pane, Dialog, StatusIndicator
} from 'evergreen-ui';

import '../styles/App.css';
import { useState } from 'react';

import {
  Col,
  Row,
  Container,
  Card
} from 'react-bootstrap';

function App() {
  const getSaveData = (fileContents) => {
    const xorKey = "CHANGE ME TO YOUR OWN RANDOM STRING";

    const decodedFileContents = fileContents.split('').map((char, index) => {
      return String.fromCharCode(char.charCodeAt(0) ^ xorKey.charCodeAt(index % xorKey.length));
    }).join('');

    try {
      JSON.parse(decodedFileContents);
    } catch (e) {
      toaster.danger("Could not parse your save file. Make sure you are using an old save file, as new save files are not supported.");
      return null;
    }
    
    toaster.success("Successfully parsed your save file!");
    console.log(JSON.parse(decodedFileContents));
    return JSON.parse(decodedFileContents);
  }

  const [saveDataFile, setSaveDataFile] = useState(null);
  const [saveData, setSaveData] = useState(null);
  
  const handleFileUpload = (file) => {
    file = file[0];

    setSaveDataFile(file);

    console.log(file.name + " uploaded");

    var reader = new FileReader();
    reader.onload = function(e) {
      var contents = e.target.result;
      setSaveData(getSaveData(contents));
    };

    reader.readAsText(file);
  }

  const SaveDataPropertyEditor = (props) => {
    const {
      Key,
      Value
    } = props.item;

    const [textValue, setTextValue] = useState(Value);
    const [isEdited, setIsEdited] = useState(false);

    const save = () => {
      saveData.IntData.find((x) => x.Key === Key).Value = textValue;
      setSaveData(saveData);
      setIsEdited(false);
    }

    return (
      <Col style={{ padding: "20px" }}>
        <h5>{Key} {isEdited ? (
          <>
            <StatusIndicator
              color="#5C85FF"
            />
          </>
        ) : null}</h5>
        <TextInput
          value={textValue}
          onChange={(e) => {
            setTextValue(e.target.value);
            setIsEdited(true);
          }}
          {
            ...(!Number.isInteger(Number(textValue)) ? { isInvalid: true } : {}
                && textValue.length <= 0 ? { isInvalid: true } : {})
          }
        />

        <Button
          onClick={() => {
            if (textValue.length <= 0) {
              toaster.danger(Key + " cannot be empty. Please enter a value.");
              return;
            }

            save();
            toaster.success("Successfully updated " + Key + "!");
          }}
          appearance="primary"
          marginTop={8}
          marginBottom={16}
          iconBefore={EditIcon}
          disabled={!Number.isInteger(Number(textValue)) || textValue.length <= 0}
        >Save</Button>
      </Col>
    )
  }

  const UnloadSaveButton = () => {
    const [isShown, setIsShown] = useState(false);

    return (
      <>
        <Button
          appearance="primary"
          marginTop={8}
          marginLeft={6}
          onClick={() => setIsShown(true)}
          intent="danger"
        >Unload Save File</Button>

        <Pane>
          <Dialog
            isShown={isShown}
            title="Do you want to unload this file and lose all changes?"
            intent="danger"
            onCloseComplete={() => setIsShown(false)}
            onConfirm={() => {
              setIsShown(false);

              setSaveDataFile(null);
              setSaveData(null);

              toaster.success("Successfully unloaded save file!");
            }}
            onCancel={() => {
              setIsShown(false);
            }}
            confirmLabel="Yes"
          >
            Are you sure you want to delete this item?
          </Dialog>
        </Pane>
      </>
    );
  }

  return (
    <div className="App">
      <Container 
        expand="lg"
        style={{
          marginTop: "8rem"
        }}
      >
        <h1>Phasmophobia Save Editor</h1>
        {saveData ? (
          <>
            <p style={{ marginBottom: "3px" }}>Loaded save file: <strong>{saveDataFile.name}</strong></p>
            <p style={{ marginBottom: "3px" }}>Data XOR cipher: <strong><code>CHANGE ME TO YOUR OWN RANDOM STRING</code></strong></p>
            <p style={{ marginBottom: "3px" }}>Save file size (bytes): <strong>{saveDataFile.size} bytes</strong></p>

            <Button
              appearance="primary"
              marginTop={8}
              onClick={() => {
                const xorKey = "CHANGE ME TO YOUR OWN RANDOM STRING";

                const encodedSaveData = JSON.stringify(saveData).split('').map((char, index) => {
                  return String.fromCharCode(char.charCodeAt(0) ^ xorKey.charCodeAt(index % xorKey.length));
                }).join('');

                const blob = new Blob([encodedSaveData], { type: "text/plain;charset=utf-8" });
                const url = URL.createObjectURL(blob);

                const a = document.createElement("a");
                a.href = url;
                a.download = saveDataFile.name;
                a.click();

                URL.revokeObjectURL(url);
                toaster.success("Successfully re-encoded your save file! The download should begin shortly.");
              }}
            >Download Updated Save File</Button>

            <UnloadSaveButton />
          </>
        ) : (
          <>
            <p>Upload a save file to edit.</p>
            <p>Make sure to use an older save file. If you don't have one, click the button below to download and load one.</p>

            <Button
              appearance="primary"
              marginTop={8}
              onClick={() => {
                const xhr = new XMLHttpRequest();
                xhr.open("GET", "saveData.txt", true);
                xhr.responseType = "blob";

                xhr.onload = (e) => {
                  if (xhr.status === 200) {
                    const blob = xhr.response;
                    const file = new File([blob], "saveFile.txt", { type: "text/plain;charset=utf-8" });

                    handleFileUpload([file]);

                    toaster.success("Successfully downloaded save file!");
                  } else {
                    toaster.danger("Could not download the default save file. Please try again later.");
                  }
                }

                xhr.send();
              }}
            >Download Default Save File</Button>
          </>
        )}
        <hr />
        {saveData ? (
          <div>
            <Row>
              {saveData.IntData.map((item, index) => {
                return (
                  <SaveDataPropertyEditor
                    item={item}
                    index={index}
                  />
                );
              })}
            </Row>
          </div>
        ) : (
          <div
            style={{
              alignItems: "center"
            }}
          >
            <p>Choose a save file by using the file picker</p>
            <FilePicker
              width={250}
              onChange={handleFileUpload}
              placeholder="Select a save file (saveData.txt)"
              accept=".txt"
              style={{
                marginLeft: "auto",
                marginRight: "auto"
              }}
            />
          </div>
        )}
      </Container>
    </div>
  );
}

export default App;
