/*
 * Copyright (c) 2022, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import React from 'react';
import Grid from '@material-ui/core/Grid';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import Paper from '@material-ui/core/Paper';
import { FormattedMessage, injectIntl } from 'react-intl';
import Progress from 'AppComponents/Shared/Progress';
import Alert from 'AppComponents/Shared/Alert';
import API from 'AppData/api';
import Certificates from './Certificates';

/**
 *
 * @inheritdoc
 * @param {*} theme theme
 */
const styles = (theme) => ({
    input: {
        marginLeft: theme.spacing(1),
        flex: 1,
    },
    iconButton: {
        padding: 10,
    },
    divider: {
        height: 28,
        margin: 4,
    },
    root: {
        padding: theme.spacing(3),
        '& h5': {
            color: theme.palette.getContrastText(theme.palette.background.default),
        },
    },
    firstCell: {
        paddingLeft: 0,
    },
    cardTitle: {
        paddingLeft: theme.spacing(2),
    },
    titleWrapper: {
        display: 'flex',
        alignItems: 'center',
        '& h5': {
            marginRight: theme.spacing(1),
        },
    },
    dialogTitle: {
        display: 'flex',
        alignItems: 'flex-start',
        padding: theme.spacing(1),
    },
    genericMessageWrapper: {
        margin: theme.spacing(2),
    },
    clearSearchIcon: {
        cursor: 'pointer',
    },
    outterBox: {
        margin: theme.spacing(1),
        padding: theme.spacing(1),
        borderColor: theme.palette.text.secondary,
        marginLeft: 20,
    },
    formLabel: {
        margin: theme.spacing(1),
        padding: theme.spacing(1),
    },
    subTitle: {
        marginBottom: theme.spacing(2),
    },
});

class MutualTLS extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            certificates: [],
            // openDialog: false,
            nameList: [],
            application: null,
        };
    }

    componentDidMount() {
        const { applicationId, application, keyType } = this.props;
        const names = [];
        const client = new API();
        this.setState({
            application,
        });
        const promisedCertificates = client.getAllClientCertificates(applicationId);
        promisedCertificates.then((response) => {
            this.setState({
                certificates: response.body.certificates,
            }, () => {
                let certificate;
                for (certificate of this.state.certificates) {
                    if (certificate.type === keyType) {
                        names.push(certificate.name);
                    }
                }
                this.setState({
                    nameList: names,
                });
            });
        });
    }

    saveEdit = () => {
        const {
            intl,
        } = this.props;
        const { application: { oldApplication } } = this.state;
        this.setState({
            application: oldApplication,
        }, () => {
            const api = new API();
            const updatedApplication = api.updateApplication(this.state.application, null);
            updatedApplication.then(() => {
                // const appId = response.body.applicationId;
                Alert.info(intl.formatMessage({
                    id: 'Applications.ApplicationFormHandler.app.updated.success',
                    defaultMessage: 'Application updated successfully',
                }));
            })
                .catch((error) => {
                    const { response } = error;
                    if (response && response.body) {
                        const message = response.body.description || 'Error while updating the application';
                        Alert.error(message);
                    } else {
                        Alert.error(error.message);
                    }
                    console.error('Error while updating the application');
                });
        });
    };

    render() {
        const { certificates } = this.state;
        const {
            classes, applicationId, keyType,
        } = this.props;

        if (certificates) {
            return (
                <Paper>

                    <div className={classes.root}>
                        <div className={classes.titleWrapper}>
                            <Typography variant='h5' className={classes.keyTitle}>
                                <FormattedMessage
                                    id='Application.Certificate.Details.title'
                                    defaultMessage=' Certificate Management'
                                />
                            </Typography>
                        </div>
                        <div className={classes.subTitle}>
                            <Typography variant='caption'>
                                <FormattedMessage
                                    id='Applications.Certificate.Details.sub.heading'
                                    defaultMessage='Attach certificates to application to deploy in the Gateway'
                                />
                            </Typography>

                        </div>
                        <div className={classes.contentWrapper}>
                            <Grid container direction='row' spacing={0} justify='left' alignItems='left'>
                                <Grid item md={5} xs={12}>
                                    <>
                                        <Box border={1} borderRadius={5} className={classes.outterBox}>
                                            <Certificates
                                                certificates={this.state.certificates}
                                                applicationId={applicationId}
                                                nameList={this.state.nameList}
                                                keyType={keyType}
                                            />

                                        </Box>

                                    </>
                                </Grid>
                            </Grid>
                        </div>

                    </div>
                </Paper>
            );
        } else {
            return (
                <Progress />
            );
        }
    }
}
MutualTLS.propTypes = {
    classes: PropTypes.shape({}).isRequired,
    match: PropTypes.shape({
        params: PropTypes.shape({
            applicationId: PropTypes.string,
        }).isRequired,
    }).isRequired,
    intl: PropTypes.shape({}).isRequired,
};

export default injectIntl(withStyles(styles)(MutualTLS));