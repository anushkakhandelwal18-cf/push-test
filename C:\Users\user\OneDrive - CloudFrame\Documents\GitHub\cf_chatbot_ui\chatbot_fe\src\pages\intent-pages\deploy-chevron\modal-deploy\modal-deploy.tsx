import { Button, Checkbox, Form, Input, message, Modal, Select, Upload } from "antd";
import { useState } from "react";
import { FaBitbucket, FaGithub, FaGitlab } from "react-icons/fa";
import { UploadOutlined } from '@ant-design/icons';
import axios from 'axios';


const ModalDeploy = ({ setRepoModalVisible, isRepoModalVisible, selectedPlatform, formSubmitted }) => {

    const [fileList, setFileList] = useState<any[]>([]);

    const props = {
        onRemove: (file: any) => {
            setFileList((prevFileList) => {
                const index = prevFileList.indexOf(file);
                const newFileList = prevFileList.slice();
                newFileList.splice(index, 1);
                return newFileList;
            });
        },
        beforeUpload: (file: any) => {
            setFileList((prevFileList) => [...prevFileList, file]);
            return false;
        },
        fileList,
    };

    const handleUpload = () => {
        if (fileList.length === 0) {
            message.error('Please select a file before uploading.');
            return;
        }
        message.success('Upload successful!');
    };

    const platformTitles = {
        github: 'GitHub',
        gitlab: 'GitLab',
        bitbucket: 'Bitbucket'
    };

    const platformIcons = {
        github: <FaGithub />,
        gitlab: <FaGitlab />,
        bitbucket: <FaBitbucket />
    };
    const handleRepoModalClose = () => {
        setRepoModalVisible(false);
    };

    const [form] = Form.useForm();

    const createGitHubRepo = async (values) => {
        const { repository, visibility, accessToken, branch , commitMessage } = values;
        const repoName = repository;
        const isPrivate = visibility === 'private';

        try {
            // Create GitHub Repository
            const createRepoResponse = await axios.post(
                'https://api.github.com/user/repos',
                {
                    name: repoName,
                    private: isPrivate,
                    auto_init: true, 
                    default_branch: branch,
                },
                {
                    headers: {
                        Authorization: `token ${accessToken}`,
                        Accept: 'application/vnd.github.v3+json',
                    },
                }
            );

            const { owner, name: repo } = createRepoResponse.data;

            const repoUrl = `${owner.login}/${repo}`;
             

            // Upload the Deployment Script File 
            if (fileList.length > 0) {
                const file = fileList[0];
                const fileContent = await file.text();
                const encodedContent = btoa(fileContent); 

                // Commit the file
                await axios.put(
                    `https://api.github.com/repos/${owner.login}/${repo}/contents/${file.name}`,
                    {
                        message: commitMessage,
                        content: encodedContent,
                        branch: branch,
                    },
                    {
                        headers: {
                            Authorization: `token ${accessToken}`,
                            Accept: 'application/vnd.github.v3+json',
                        },
                    }
                );

                message.success('Deployment script uploaded successfully!');
            } else {
                message.info('No deployment script uploaded.');
            }

            message.success(`Repository "${repoName}" created successfully!`);
            formSubmitted(); 
        } catch (error) {
            message.error('An error occurred during deployment.');
            console.error('Error:', error);
        }
    };

    const handleFormSubmit = () => {
        form
            .validateFields()
            .then((values) => {
                console.log('Form values:', values);
                formSubmitted();
            })
            .catch((errorInfo) => {
                console.error('Validation failed:', errorInfo);
            });
    };
    return (
        <Modal
            title={
                <div className="text-center font-semibold text-lg flex items-center justify-center">
                    {platformIcons[selectedPlatform]}
                    <span className="ml-2">Deploy to {platformTitles[selectedPlatform]}</span>
                </div>
            }
            visible={isRepoModalVisible}
            onOk={handleFormSubmit}
            onCancel={handleRepoModalClose}
            footer={[
                <Button key="back" onClick={handleRepoModalClose}>
                    Cancel
                </Button>,
                <Button key="submit" type="primary" onClick={handleFormSubmit}>
                    Deploy
                </Button>,
            ]}
        >
            <hr className="my-4 border-gray-300" />
            <Form
                form={form}
                layout="vertical"
                initialValues={{
                    repository: 'CFBOOKSJ',
                    branch: 'master',
                    commitMessage: 'Initial Commit',
                    visibility: 'public',
                    autoInit: true,
                    accessToken: 'someAccessToken',
                }}
            >
                <Form.Item
                    label="Repository Name"
                    name="repository"
                    rules={[{ required: true, message: 'Please enter a repository name!' }]}
                >
                    <Input placeholder="Enter repository name" />
                </Form.Item>
                <Form.Item label="Branch Name (Optional)" name="branch">
                    <Input placeholder="Enter branch name (default: master)" />
                </Form.Item>
                <Form.Item
                    label="Commit Message"
                    name="commitMessage"
                    rules={[{ required: true, message: 'Please enter a commit message!' }]}
                >
                    <Input placeholder="Enter a commit message" />
                </Form.Item>
                <Form.Item label="Repository Visibility" name="visibility">
                    <Select>
                        <Select.Option value="public">Public</Select.Option>
                        <Select.Option value="private">Private</Select.Option>
                    </Select>
                </Form.Item>
                <Form.Item name="autoInit" valuePropName="checked">
                    <Checkbox>Initialize with README</Checkbox>
                </Form.Item>
                <Form.Item
                    label={`${platformTitles[selectedPlatform]} Access Token`}
                    name="accessToken"
                    rules={[{ required: true, message: 'Please enter your access token!' }]}
                >
                    <Input.Password placeholder="Enter personal access token" />
                </Form.Item>
                <Form.Item
                    label="Upload Deployment Script File (Optional)"
                    name="deploymentScript"
                >
                    <div>
                        <Upload {...props} multiple>
                            <Button icon={<UploadOutlined />}>Select File</Button>
                        </Upload>
                    </div>
                </Form.Item>
            </Form>
        </Modal>
    )
}
export default ModalDeploy;