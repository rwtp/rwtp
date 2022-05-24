import { useState } from 'react';
import { is_valid_custom_schema } from '../lib/schemaValidator';
import defaultSchema from '../offer_schemas/QmX6CZ7Wf8B79EX5x1PJSityvhtvvFKhkDBCDZK2cd6adF.json';
import { DEFAULT_OFFER_SCHEMA } from '../lib/constants';

export function InputCustomSchema(props: {
    JSONSchema: string;
    IPFSSchema: string;
    setJSONSchema: (schema: string) => void;
    setIPFSSchema: (schema: string) => void;
}) {
    const [useCustomSchemaJSON, setUseCustomSchemaJSON] = useState(false);
    const [useCustomSchemaIPFS, setUseCustomSchemaIPFS] = useState(false);
    const setCustomSchemaJSON = props.setJSONSchema;
    const setCustomSchemaIPFS = props.setIPFSSchema;
    const customJSONSchema = props.JSONSchema;
    const cancelButton = (
        <button
            className="flex items-center px-4 py-2 rounded bg-black text-white border-black hover:opacity-50 transition-all"
            onClick={() => {
                setUseCustomSchemaJSON(false);
                setUseCustomSchemaIPFS(false);
                setCustomSchemaJSON('');
                setCustomSchemaIPFS('');
            }}
        >
            Cancel
        </button>
    );

    return (
        <div className="flex flex-col">
            <div>
                You are currently using the 
                &nbsp;<a 
                    className="underline decoration-sky-800"
                    href="https://github.com/rwtp/rwtp/blob/main/www/offer_schemas/QmX6CZ7Wf8B79EX5x1PJSityvhtvvFKhkDBCDZK2cd6adF.json"
                >
                    default 
                </a>&nbsp;
                offer schema if
                you'd like to use a custom one click 
                &nbsp;<a className="underline decoration-sky-800 hover:cursor-pointer" onClick={(e) => {
                    setUseCustomSchemaJSON(true);
                    setUseCustomSchemaIPFS(false);
                }}>
                    here
                </a>&nbsp;
                to upload a new schema or click 
                &nbsp;<a className="underline decoration-sky-800 hover:cursor-pointer" onClick={(e) => {
                    setUseCustomSchemaIPFS(true);
                    setUseCustomSchemaJSON(false);
                }}>
                    here
                </a>&nbsp;
                to use an existing schema on ipfs.
            </div>
            {useCustomSchemaJSON && (
                <div className="flex flex-col">
                    <label className="flex flex-col mb-2">
                        <div className="font-sans mb-1 text-base">Offer Schema</div>
                        <textarea
                            rows={10}
                            className="border px-4 py-2 rounded"
                            placeholder={JSON.stringify(defaultSchema, null, 2)}
                            onChange={(e) =>
                                setCustomSchemaJSON(e.target.value)
                            }
                        />
                    </label>
                    {/* here are two elements next to eachother */}
                    <div className="flex flex-row">

                        <span>
                            {cancelButton}
                        </span>
                        <span className='flex items-center px-4 py-2 rounded text-white border-black hover:opacity-50 transition-all mb-2'>
                            {customJSONSchema && is_valid_custom_schema(customJSONSchema) ? (
                                <div className="text-green-500">
                                    JSON is valid!
                                </div>
                            ) : (
                                <div className="text-red-500">
                                    Invalid JSON
                                </div>
                            )}
                        </span>
                    </div>
                </div>
            )}
            {useCustomSchemaIPFS && (
                <div className="flex flex-col">
                    <label className="flex flex-col mb-2">
                        <div className="font-sans mb-2 text-base">Offer Schema</div>
                        <input
                            className="border px-4 py-2 rounded"
                            type="string"
                            placeholder={`ipfs://${DEFAULT_OFFER_SCHEMA}`}
                            onChange={(e) =>
                                setCustomSchemaIPFS(e.target.value)
                            }
                        />
                    </label>
                    <span>
                        {cancelButton}
                    </span>
                </div>
            )}
        </div>
    );
}