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

import React, { useEffect, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {
    Divider,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    Icon,
    IconButton,
    List,
    ListItem,
    ListItemAvatar,
    ListItemSecondaryAction,
    ListItemText,
    Typography,
} from '@material-ui/core';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import CircularProgress from '@material-ui/core/CircularProgress';
import API from 'AppData/api';
import Alert from 'AppComponents/Shared/Alert';
import UploadCertificate from './UploadCertificate';

const useStyles = makeStyles((theme) => ({
    fileinput: {
        display: 'none',
    },
    dropZoneWrapper: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        '& span.material-icons': {
            color: theme.palette.primary.main,
        },
    },
    uploadedFile: {
        fontSize: 11,
    },
    certificatesHeader: {
        fontWeight: 600,
        marginTop: theme.spacing(1),
    },
    addCertificateBtn: {
        borderColor: '#c4c4c4',
        borderRadius: '8px',
        borderStyle: 'dashed',
        borderWidth: 'thin',
    },
    certificateList: {
        maxHeight: '250px',
        overflow: 'auto',
        paddingTop: theme.spacing(1),
    },
    certDetailsHeader: {
        fontWeight: '600',
    },
    uploadCertDialogHeader: {
        fontWeight: '600',
    },
    alertWrapper: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
    },
    warningIcon: {
        marginRight: 13,
        color: theme.custom.warningColor,
        '& .material-icons': {
            fontSize: 30,
        },
    },
    deleteIcon: {
        color: theme.palette.error.dark,
        cursor: 'pointer',
    },
    deleteIconDisable: {
        color: theme.palette.disabled,
    },
    formLabel: {
        color: 'red',
        paddingTop: theme.spacing(1),
    },
}));

/**
 * Uploads certificates
 *
 * @param {int} props The first number.
 */
function Certificates(props) {
    const {
        certificates, applicationId, nameList, intl, keyType,
    } = props;
    const [certificateList, setCertificateList] = useState([]);
    const [openCertificateDetails, setOpenCertificateDetails] = useState({ open: false, anchor: null, details: {} });
    const [certificateToDelete, setCertificateToDelete] = useState({ open: false, UUID: '', name: '' });
    const [isDeleting, setDeleting] = useState(false);
    const [uploadCertificateOpen, setUploadCertificateOpen] = useState(false);
    const classes = useStyles();

    /**
     * Show the selected certificate details in a popover.
     *
     * @param {any} event The button click event.
     * @param {string} UUID  The UUID of the certificate which information is required.
     * */
    const showCertificateDetails = (event, name, UUID) => {
        const client = new API();
        client.getClientCertificateByUUID(applicationId, UUID)
            .then((response) => {
                setOpenCertificateDetails({
                    details: response.body,
                    open: true,
                    name,
                    anchor: event.currentTarget,
                });
            })
            .catch((err) => {
                console.error(err);
            });
    };

    const saveCertificate = (certificate, name) => {
        const client = new API();
        return client.addClientCertificate(applicationId, certificate.content, name, keyType)
            .then((response) => {
                const tmpCertificates = [...certificateList];
                tmpCertificates.push(response.body);
                setCertificateList(tmpCertificates);
                Alert.info(intl.formatMessage({
                    id: 'Applications.Details.certificate.name.add.success',
                    defaultMessage: 'Certificate added successfully',
                }));
            }).catch((error) => {
                console.error(error);
                if (error.response) {
                    Alert.error(error.response.body.description);
                } else {
                    Alert.error(intl.formatMessage({
                        id: 'Applications.Details.certificate.name.error',
                        defaultMessage: 'Something went wrong while adding the Application certificate',
                    }));
                }
            });
    };

    /**
     * Delete certificate represented by the UUID.
     *
     * @param {string} UUID The UUID of the certificate that is needed to be deleted.
     * */
    const deleteCertificateByUUID = (UUID) => {
        setDeleting(true);
        const client = new API();
        client.deleteClientCertificateByUUID(applicationId, UUID)
            .then(() => {
                setCertificateList(() => {
                    return certificateList.filter((cert) => {
                        return cert.UUID !== UUID;
                    });
                });
                setCertificateToDelete({ open: false, UUID: '', name: '' });

                Alert.info(intl.formatMessage({
                    id: 'Applications.Details.certificate.delete.success',
                    defaultMessage: 'Certificate Deleted Successfully',
                }));
            })
            .finally(() => {
                setDeleting(false);
            });
    };

    useEffect(() => {
        const certs = [];
        let cert;
        for (cert of certificates) {
            if (cert.type === keyType) {
                certs.push(cert);
            }
        }
        setCertificateList(certs);
    }, [certificates]);

    return (
        <Grid container direction='column'>
            <Grid>
                <Typography className={classes.certificatesHeader}>
                    <FormattedMessage
                        id='Applications.Details.Certificates.certificates'
                        defaultMessage='Certificates'
                    />
                </Typography>
            </Grid>
            <Grid item>
                <List>
                    <ListItem
                        button
                        className={classes.addCertificateBtn}
                        onClick={() => setUploadCertificateOpen(true)}
                    >
                        <ListItemAvatar>
                            <IconButton>
                                <Icon>add</Icon>
                            </IconButton>
                        </ListItemAvatar>
                        <ListItemText primary='Add Certificate' />
                    </ListItem>
                </List>

                <List className={classes.certificateList}>
                    {certificateList.length > 0 ? (
                        certificateList.map((cert) => {
                            return (
                                <div>
                                    <ListItem>
                                        <ListItemAvatar>
                                            <Icon>lock</Icon>
                                        </ListItemAvatar>

                                        <ListItemText primary={cert.name} />
                                        <ListItemSecondaryAction>
                                            <IconButton
                                                edge='end'
                                                onClick={(event) => showCertificateDetails(event, cert.name, cert.UUID)}
                                            >
                                                <Icon>info</Icon>
                                            </IconButton>
                                            <IconButton
                                                onClick={() => setCertificateToDelete({ open: true, UUID: cert.UUID, name: cert.name })}
                                            >
                                                <Icon
                                                    className={classes.deleteIcon}
                                                >
                                                    {' '}
                                                    delete
                                                </Icon>
                                            </IconButton>
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                    <Divider
                                        light
                                        variant='middle'
                                    />

                                </div>
                            );
                        })
                    ) : (
                        <ListItem>
                            <ListItemAvatar>
                                <Icon color='primary'>info</Icon>
                            </ListItemAvatar>
                            <ListItemText>You do not have any certificates uploaded</ListItemText>
                        </ListItem>
                    )}
                </List>

            </Grid>

            <Dialog open={certificateToDelete.open}>
                <DialogTitle>
                    <Typography className={classes.uploadCertDialogHeader}>
                        <FormattedMessage
                            id='Applicationsis.Details.Certificates.deleteCertificate'
                            defaultMessage='Delete Certificate'
                        />
                    </Typography>
                </DialogTitle>
                <DialogContent className={classes.alertWrapper}>
                    <Typography>
                        <FormattedMessage
                            id='Applications.Details.Certificates.confirm.certificate.delete'
                            defaultMessage='Do you want to delete '
                        />
                        {' '}
                        {certificateToDelete.name + '?'}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => deleteCertificateByUUID(certificateToDelete.UUID)}
                        variant='contained'
                        color='primary'
                        disabled={isDeleting}
                        autoFocus
                    >
                        <FormattedMessage
                            id='Applications.Details.Certificates.delete.ok.button'
                            defaultMessage='OK'
                        />
                        {isDeleting && <CircularProgress size={24} />}

                    </Button>
                    <Button onClick={() => setCertificateToDelete({ open: false, name: '' })}>
                        <FormattedMessage
                            id='Applications.Details.Certificates.delete.cancel.button'
                            defaultMessage='Cancel'
                        />
                    </Button>
                </DialogActions>
            </Dialog>
            <Dialog open={openCertificateDetails.open}>
                <DialogTitle>
                    <Typography className={classes.certDetailsHeader}>
                        <FormattedMessage
                            id='Applications.Details.Certificates.certificate.details.of'
                            defaultMessage='Details of'
                        />
                        {' ' + openCertificateDetails.name}
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    <Typography>
                        <FormattedMessage
                            id='Applications.Details.Certificates.status'
                            defaultMessage='Status'
                        />
                        {' : ' + openCertificateDetails.details.status}
                    </Typography>
                    <Typography>
                        <FormattedMessage
                            id='Applications.Details.Certificates.subject'
                            defaultMessage='Subject'
                        />
                        {' : ' + openCertificateDetails.details.subject}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setOpenCertificateDetails({ open: false, anchor: null, details: {} })}
                        color='primary'
                    >
                        <FormattedMessage
                            id='Applications.Details.Certificates.details.close.button'
                            defaultMessage='Close'
                        />
                    </Button>
                </DialogActions>
            </Dialog>

            <UploadCertificate
                uploadCertificateOpen={uploadCertificateOpen}
                setUploadCertificateOpen={setUploadCertificateOpen}
                applicationId={applicationId}
                uploadCertificate={saveCertificate}
                nameList={nameList}
            />
        </Grid>

    );
}
Certificates.defaultProps = {
    applicationId: '',
};

Certificates.propTypes = {
    classes: PropTypes.shape({
        fileinput: PropTypes.shape({}),
        button: PropTypes.shape({}),
    }).isRequired,
    certificates: PropTypes.shape({}).isRequired,
    // uploadCertificate: PropTypes.func.isRequired,
    // deleteCertificate: PropTypes.func.isRequired,
    applicationId: PropTypes.string,
    nameList: PropTypes.shape([]).isRequired,
};

export default injectIntl((Certificates));